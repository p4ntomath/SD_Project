import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject, getProjectDetails} from '../backend/firebase/projectDB';
import { fetchDocumentsByFolder } from '../backend/firebase/documentsDB';
import { ClipLoader } from 'react-spinners';
import StatusModal from '../components/StatusModal';
import CreateProjectForm from '../components/CreateProjectForm';
import { AnimatePresence, motion } from 'framer-motion';
import ProjectReviews from '../components/ProjectDetailsPage/ProjectReviews';
import { getReviewerRequestsForProject } from '../backend/firebase/reviewerDB';
import { updateExistingReviewerInfo } from '../backend/firebase/reviewerDB';
import ReviewersCard from '../components/ProjectDetailsPage/ReviewersCard';
import DocumentsCard from '../components/ProjectDetailsPage/DocumentsCard';
import FundingCard from '../components/ProjectDetailsPage/FundingCard';
import GoalsCard from '../components/ProjectDetailsPage/GoalsCard';
import BasicInfoCard from '../components/ProjectDetailsPage/BasicInfoCard';
import { notify } from '../backend/firebase/notificationsUtil';
import AssignCollaboratorsModal from '../components/ResearcherComponents/AssignCollaboratorsModal';
import { sendResearcherInvitation, getPendingCollaboratorInvitations } from '../backend/firebase/collaborationDB';
import { auth } from '../backend/firebase/firebaseConfig';
import { checkPermission, isProjectOwner } from '../utils/permissions';
import { updateCollaboratorAccessLevel, removeCollaboratorFromProject } from "../backend/firebase/collaborationDB";
import { ChatService } from '../backend/firebase/chatDB';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignReviewersModal, setShowAssignReviewersModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [groupChatId, setGroupChatId] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showGroupNameModal, setShowGroupNameModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for documents and folders
  const [folders, setFolders] = useState([]);
  const [reviewRequests, setReviewRequests] = useState([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProject(projectId);
        if (!projectData) {
          setModalOpen(true);
          setError(true);
          setStatusMessage('Project not found');
          return;
        }
        
        if (projectData.goals) {
          projectData.goals = projectData.goals.map(goal =>
            typeof goal === 'string'
              ? { text: goal, completed: false, notified: false }
              : { ...goal, notified: goal.notified || false }
          );
        }
        
        // Ensure deadline and duration are properly handled
        if (projectData.deadline) {
          projectData.deadline = typeof projectData.deadline === 'string' 
            ? new Date(projectData.deadline)
            : projectData.deadline;

          // Calculate and set duration based on deadline
          const today = new Date();
          const deadlineDate = new Date(projectData.deadline.seconds ? projectData.deadline.seconds * 1000 : projectData.deadline);
          const durationDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
          const months = Math.floor(durationDays / 30);
          
          projectData.duration = months > 0 
            ? `${months} month${months > 1 ? 's' : ''}`
            : `${durationDays} day${durationDays > 1 ? 's' : ''}`;
        }
        
        projectData.id = projectData.id || projectId;
        projectData.status = projectData.status || 'In Progress';
        projectData.availableFunds = projectData.availableFunds || 0;
        projectData.usedFunds = projectData.usedFunds || 0;
        
        setProject(projectData);
        setError(false);
      } catch (err) {
        
        setModalOpen(true);
        setError(true);
        setStatusMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projectData = await getProjectDetails(projectId);
        if (projectData) {
          // Update existing reviewer information
          await updateExistingReviewerInfo(projectId);
          // Reload project to get updated reviewer info
          const refreshedProject = await getProjectDetails(projectId);
          setProject(refreshedProject);
          // Get all review requests and process them
          const requests = await getReviewerRequestsForProject(projectId);
          if (requests && Array.isArray(requests)) {
            const processedRequests = requests.map(request => ({
              id: request.id,
              reviewerId: request.reviewerId,
              reviewerName: request.reviewerName || 'Anonymous Reviewer',
              status: request.status || 'pending',
              requestedAt: request.requestedAt || new Date(),
            }));
            setReviewRequests(processedRequests);
          }
        }
      } catch (err) {
        
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setFoldersLoading(true);
        const folderData = await fetchDocumentsByFolder(projectId);
        if (!folderData || folderData.length === 0) {
          setFolders([]);
          return;
        }

        // Process the folders to ensure all required file metadata is present
        const processedFolders = folderData.map(folder => ({
          ...folder,
          files: folder.files.map(file => ({
            ...file,
            id: file.id || file.documentId,
            documentId: file.documentId || file.id,
            name: file.name || file.fileName || 'Unnamed File',
            fileName: file.fileName || file.name,
            uploadDate: file.uploadedAt ? new Date(file.uploadedAt.seconds * 1000) : new Date(),
          }))
        }));

        setFolders(processedFolders);
      } catch (err) {
        
        setError(true);
        setModalOpen(true);
        setStatusMessage('Failed to load project documents');
      } finally {
        setFoldersLoading(false);
      }
    };

    if (projectId) {
      loadFolders();
    }
  }, [projectId]);

  useEffect(() => {
    const loadReviewRequests = async () => {
      try {
        // Get all review requests for this project
        const requests = await getReviewerRequestsForProject(projectId);
        // Make sure each request has the required properties
        const processedRequests = requests.map(request => ({
          id: request.id,
          reviewerId: request.reviewerId,
          reviewerName: request.reviewerName || 'Anonymous Reviewer',
          status: request.status || 'pending',
          requestedAt: request.requestedAt || new Date(),
        }));
        setReviewRequests(processedRequests);
      } catch (err) {
        
        setError(true);
        setModalOpen(true);
        setStatusMessage('Failed to load reviewer requests');
      }
    };

    if (projectId) {
      loadReviewRequests();
    }
  }, [projectId]);

  useEffect(() => {
    const loadPendingInvitations = async () => {
      try {
        const invitations = await getPendingCollaboratorInvitations(projectId);
        setPendingInvitations(invitations);
      } catch (err) {
        
        // Don't show error modal for this as it's not critical
      }
    };

    if (projectId) {
      loadPendingInvitations();
    }
  }, [projectId]);

  // Check for existing project group chat
  useEffect(() => {
    const checkExistingProjectChat = async () => {
      if (!project?.collaborators?.length) return;
      
      try {
        const chats = await ChatService.getUserChats(auth.currentUser.uid);
        const projectChat = chats.find(chat => 
          chat.type === 'group' && 
          chat.projectId === projectId
        );
        
        if (projectChat) {
          setGroupChatId(projectChat.id);
        }
      } catch (error) {
        
      }
    };

    checkExistingProjectChat();
  }, [project, projectId]);

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      setModalOpen(true);
      setStatusMessage("Project deleted successfully");

      notify({
        type: "Project Deleted",
        projectId: projectId,
        projectTitle: project.title,
        targetUserId: auth.currentUser?.uid,   // <-- add this
        senderUserId: auth.currentUser?.uid,   // <-- add this (optional, but explicit)
      });

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to delete project: " + err.message);
    }
  };

  const handleUpdate = async (updatedProject) => {
    try {
      setUpdateLoading(true);
      const { id, userId, createdAt, goalInput, ...updateData } = updatedProject;
      
      // Preserve existing funding and status values if not changed
      updateData.availableFunds = updatedProject.availableFunds ?? project.availableFunds;
      updateData.usedFunds = updatedProject.usedFunds ?? project.usedFunds;
      updateData.status = updatedProject.status ?? project.status;
      
      // Recalculate duration if deadline has changed
      if (updateData.deadline) {
        const today = new Date();
        const deadlineDate = new Date(updateData.deadline);
        const durationDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        const months = Math.floor(durationDays / 30);
        
        updateData.duration = months > 0 
          ? `${months} month${months > 1 ? 's' : ''}`
          : `${durationDays} day${durationDays > 1 ? 's' : ''}`;
      }
      
      await updateProject(projectId, updateData);
      setProject({ ...project, ...updateData });
      setIsEditing(false);
      setModalOpen(true);
      setStatusMessage("Project updated successfully");

      notify({
        type: "Project Updated",
        projectId,
        projectTitle: updatedProject.title,
        goalText: goalInput,
        targetUserId: auth.currentUser?.uid,   // <-- add this
        senderUserId: auth.currentUser?.uid,   // <-- add this (optional, but explicit)
      });

    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to update project: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  
  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp !== 'object') return 'Not specified';
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Not specified';
  };

  const calculateProgress = () => {
    if (!project.goals || project.goals.length === 0) return 0;
    const completed = project.goals.filter(goal => goal.completed).length;
    if(Math.round((completed / project.goals.length) * 100) === 100){
      project.status = 'Complete';
       
    }
    else{
      project.status = 'In Progress';
    }

 
    return Math.round((completed / project.goals.length) * 100);
  };


  const handleAssignCollaborators = async (selectedResearchers) => {
    try {
      // Send invitations to all selected researchers with their assigned roles
      const invitationPromises = selectedResearchers.map(researcher => 
        sendResearcherInvitation(
          projectId, 
          researcher.id,
          auth.currentUser.uid,
          researcher.role // Pass the assigned role
        )
      );

      // Wait for all invitations to be sent
      await Promise.all(invitationPromises);
      
      // Fetch the updated pending invitations to get complete researcher details
      const updatedInvitations = await getPendingCollaboratorInvitations(projectId);
      setPendingInvitations(updatedInvitations);
      
      setShowCollaboratorsModal(false);
      setModalOpen(true);
      setError(false);
      setStatusMessage(
        <div className="flex items-center gap-2 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Successfully sent {selectedResearchers.length} collaboration invitation{selectedResearchers.length !== 1 ? 's' : ''}</span>
        </div>
      );
    } catch (err) {
     
      setModalOpen(true);
      setError(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-red-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>{err.message || "Failed to send collaborator invitations"}</span>
        </div>
      );
    }
  };

  const handleAccessLevelChange = async (collaboratorId, newAccessLevel) => {
    try {
      await updateCollaboratorAccessLevel(projectId, collaboratorId, newAccessLevel);
      setProject(prevProject => ({
        ...prevProject,
        collaborators: prevProject.collaborators.map(collaborator =>
          collaborator.id === collaboratorId ? { ...collaborator, accessLevel: newAccessLevel } : collaborator
        )
      }));
      setModalOpen(true);
      setError(false);
      setStatusMessage("Collaborator access level updated successfully");
    } catch (err) {
      setModalOpen(true); 
      setError(true);
      setStatusMessage("Failed to update collaborator access level");
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await removeCollaboratorFromProject(projectId, collaboratorId);
      setProject(prevProject => ({
        ...prevProject,
        collaborators: prevProject.collaborators.filter(collaborator => collaborator.id !== collaboratorId)
      }));
      setModalOpen(true);
      setError(false);
      setStatusMessage("Collaborator removed successfully");
    } catch (err) {
    
      setModalOpen(true);
      setError(true);
      setStatusMessage("Failed to remove collaborator");
    }
  };

  // Add this helper function at the top of the file with other functions
const getDefaultGroupName = (projectTitle) => {
  const MAX_LENGTH = 30;
  const baseTitle = projectTitle?.length > 20 
    ? projectTitle.substring(0, 17) + '...'
    : projectTitle;
  return `${baseTitle} Team`.substring(0, MAX_LENGTH);
};

  // Replace the createProjectGroupChat function
  const createProjectGroupChat = async (customName) => {
    if (!project?.collaborators?.length || isCreatingChat || !isProjectOwner(project)) return;
    
    try {
      setIsCreatingChat(true);
      setIsSubmitting(true);
      
      // Validate and trim chat name
      const chatName = (customName || getDefaultGroupName(project.title))
        .trim()
        .substring(0, 30);

      // Get collaborator IDs
      const collaboratorIds = project.collaborators.map(c => c.id);

      // Create the group chat with project metadata
      const chatId = await ChatService.createGroupChat(
        auth.currentUser.uid,
        collaboratorIds,
        chatName,
        { projectId }  // Add projectId as metadata
      );

      setGroupChatId(chatId);
      setModalOpen(true);
      setError(false);
      setStatusMessage('Team chat created successfully!');
      setShowGroupNameModal(false);
    } catch (error) {
      ;
      setModalOpen(true);
      setError(true);
      setStatusMessage('Failed to create team chat');
    } finally {
      setIsCreatingChat(false);
      setIsSubmitting(false);
    }
  };

  const GroupNameModal = ({ isOpen, onClose, onSubmit, defaultName, isLoading }) => {
    const [localGroupName, setLocalGroupName] = useState('');
    
    useEffect(() => {
      if (isOpen) {
        setLocalGroupName(''); // Reset on open
      }
    }, [isOpen]);

    const handleInputChange = (e) => {
      if (e.target.value.length <= 30) {
        setLocalGroupName(e.target.value);
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.25 }}
                className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Create Team Chat</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={localGroupName}
                    onChange={handleInputChange}
                    placeholder={defaultName}
                    maxLength={30}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {localGroupName.length}/30 characters
                  </p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onSubmit(localGroupName || defaultName)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Chat'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <main aria-label="loading-project" className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <section className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Project Not Found</h1>
          <p className="text-gray-600 mt-2">The project you are looking for does not exist or has been deleted.</p>
          <button
            onClick={() => navigate('/home')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </section>
      </main>
    );
  }

  if (isEditing) {
    return (
      <main className="p-6">
        <nav>
          <button 
            onClick={() => setIsEditing(false)}
            className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Details
          </button>
        </nav>
        <CreateProjectForm
          projectToUpdate={project}
          isUpdateMode={true}
          onUpdate={handleUpdate}
          onCancel={() => setIsEditing(false)}
          loading={updateLoading}
        />
      </main>
    );
  }

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-16 gap-3 sm:gap-0">
            <hgroup className="flex items-center min-w-0 flex-shrink">
              <nav>
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center mr-3 flex-shrink-0"
                >
                  <FiArrowLeft className="text-xl mr-2" />
                  Back
                </button>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent truncate max-w-[150px] md:max-w-[300px] lg:max-w-none">
                {project.title}
              </h1>
            </hgroup>
            <nav className="flex gap-2 justify-start sm:justify-end flex-shrink-0">
              {(isProjectOwner(project) || checkPermission(project, 'canEditProjectDetails')) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Project
                </button>
              )}
            </nav>
          </section>
        </section>
      </header>

      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
        <article className="max-w-7xl mx-auto">

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Main Info */}
            <section className="space-y-4 sm:space-y-6">
              <BasicInfoCard 
                project={project}
                calculateProgress={calculateProgress}
                isEditable={isProjectOwner(project)}
              />

              <GoalsCard 
                project={project}
                calculateProgress={calculateProgress}
                setProject={setProject}
                projectId={projectId}
                setModalOpen={setModalOpen}
                setError={setError}
                setStatusMessage={setStatusMessage}
                updateProject={updateProject}
              />

              <DocumentsCard 
                projectId={projectId}
                project={project} // Add project prop
                folders={folders}
                setFolders={setFolders}
                foldersLoading={foldersLoading}
                setModalOpen={setModalOpen}
                setError={setError}
                setStatusMessage={setStatusMessage}
                projectTitle={project.title}
              />

              {/* Project Reviews Card */}
              <article className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Reviews</h2>
                <ProjectReviews projectId={projectId} formatDate={formatDate} />
              </article>
            </section>

            {/* Right Column - Additional Info */}
            <section className="space-y-4 sm:space-y-6">

              <FundingCard
                projectId={projectId}
                project={project}
                setProject={setProject}
                setModalOpen={setModalOpen}
                setError={setError}
                setStatusMessage={setStatusMessage}
              />

              {/* Message Board Card */}
              <article className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Discussion</h2>
                <section className="space-y-4">
                  {project.collaborators?.length > 0 ? (
                    <>
                      {groupChatId ? (
                        <article className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                          <section className="flex items-center justify-between mb-3">
                            <section className="flex items-center">
                              <figure className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                                💬
                              </figure>
                              <figcaption className="ml-3">
                                <h3 className="font-medium text-gray-900">{project.title} Team Chat</h3>
                                <p className="text-sm text-gray-500">
                                  {project.collaborators.length + 1} members
                                </p>
                              </figcaption>
                            </section>
                            <button
                              onClick={() => navigate(`/messages/${groupChatId}`)}
                              className="flex items-center px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                              Open
                            </button>
                          </section>
                          <p className="text-sm text-gray-600">
                            Discuss project updates, share ideas, and coordinate with your team in real-time.
                          </p>
                        </article>
                      ) : (
                        <section className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <figure className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586" />
                            </svg>
                          </figure>
                          <h3 className="text-gray-900 font-medium mb-2">Create Team Chat</h3>
                          <p className="text-gray-500 text-sm mb-4">
                            {isProjectOwner(project) 
                              ? "Start a group chat with your project collaborators for real-time discussions."
                              : "Only the project owner can create the team chat."}
                          </p>
                          {isProjectOwner(project) && (
                            <button
                              onClick={() => setShowGroupNameModal(true)}
                              disabled={isCreatingChat}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Create Team Chat
                            </button>
                          )}
                        </section>
                      )}
                    </>
                  ) : (
                    <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <figure className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586" />
                        </svg>
                      </figure>
                      <h3 className="text-gray-900 font-medium mb-2">No Collaborators Yet</h3>
                      <p className="text-gray-500 text-sm">
                        Add collaborators to your project to enable team chat functionality.
                      </p>
                    </section>
                  )}
                </section>
              </article>

              {/* Collaborators Card */}
              <article className="bg-white rounded-lg shadow p-4 sm:p-6">
                <header className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Project Collaborators</h2>
                  {isProjectOwner(project) && (
                    <button
                      onClick={() => setShowCollaboratorsModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Add Collaborator
                    </button>
                  )}
                </header>

                {/* Active Collaborators */}
                {project.collaborators && project.collaborators.length > 0 && (
                  <section className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Active Collaborators</h3>
                    <section className="overflow-hidden">
                      <section className="overflow-y-auto max-h-[230px] pr-2 -mr-2 no-scrollbar">
                        <section className="space-y-3">
                          {project.collaborators.map((collaborator) => (
                            <article key={collaborator.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <section className="flex items-center gap-3">
                                <figure className="p-2 bg-blue-100 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </figure>
                                <section>
                                  <h4 className="font-medium">{collaborator.fullName}</h4>
                                  <p className="text-sm text-gray-500">{collaborator.institution || 'No institution'}</p>
                                </section>
                              </section>
                              {isProjectOwner(project) && (
                                <section className="flex items-center gap-2">
                                  <select
                                    value={collaborator.accessLevel}
                                    onChange={(e) => handleAccessLevelChange(collaborator.id, e.target.value)}
                                    className="text-sm bg-white border border-gray-300 rounded-md px-2 py-1"
                                  >
                                    <option value="Collaborator">Collaborator</option>
                                    <option value="Editor">Editor</option>
                                    <option value="Viewer">Viewer</option>
                                  </select>
                                  <button
                                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Remove collaborator"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </section>
                              )}
                            </article>
                          ))}
                        </section>
                      </section>
                    </section>
                  </section>
                )}

                {/* Pending Invitations */}
                {pendingInvitations && pendingInvitations.length > 0 && (
                  <section className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Invitations</h3>
                    <section className="overflow-hidden">
                      <section className="overflow-y-auto max-h-[230px] pr-2 -mr-2 no-scrollbar">
                        <section className="space-y-3">
                          {pendingInvitations.map((invitation) => (
                            <article key={invitation.invitationId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <section className="flex items-center gap-3">
                                <figure className="p-2 bg-gray-100 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </figure>
                                <section>
                                  <h4 className="font-medium text-sm">{invitation.researcherName}</h4>
                                  <p className="text-xs text-gray-500">Invited: {formatDate(invitation.createdAt)}</p>
                                </section>
                              </section>
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                Pending Response
                              </span>
                            </article>
                          ))}
                        </section>
                      </section>
                    </section>
                  </section>
                )}

                {(!project.collaborators || project.collaborators.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No collaborators yet</p>
                )}
              </article>

              {/* Add Collaborator Modal */}
              <AnimatePresence>
                {showCollaboratorsModal && (
                  <AssignCollaboratorsModal
                    isOpen={showCollaboratorsModal}
                    onClose={() => setShowCollaboratorsModal(false)}
                    onAssign={handleAssignCollaborators}
                    projectId={projectId}
                    project={project}
                  />
                )}
              </AnimatePresence>

              <ReviewersCard 
                project={project}
                reviewRequests={reviewRequests}
                setReviewRequests={setReviewRequests}
                formatDate={formatDate}
                setShowAssignReviewersModal={setShowAssignReviewersModal}
                showAssignReviewersModal={showAssignReviewersModal}
                projectId={projectId}
                setModalOpen={setModalOpen}
                setError={setError}
                setStatusMessage={setStatusMessage}
              />
              
            </section>
          </section>

        </article>

        <StatusModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          success={!error}
          message={statusMessage}
        />

        <dialog className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center ${showDeleteConfirm ? '' : 'hidden'}`}>
          <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <motion.article
            className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <header>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete Project?</h2>
            </header>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
            <footer className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-700/90 transition-colors"
              >
                Delete
              </button>
            </footer>
          </motion.article>
        </dialog>

        <GroupNameModal
          isOpen={showGroupNameModal}
          onClose={() => setShowGroupNameModal(false)}
          onSubmit={createProjectGroupChat}
          defaultName={getDefaultGroupName(project.title)}
          isLoading={isSubmitting}
        />
      </main>
    </>
  );
}
