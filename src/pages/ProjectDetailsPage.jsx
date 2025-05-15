import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject, getProjectDetails } from '../backend/firebase/projectDB';
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
import AssignCollaboratorsModal from '../components/ResearcherComponents/AssignCollaboratorsModal';
import { sendResearcherInvitation, getPendingCollaboratorInvitations } from '../backend/firebase/collaborationDB';
import { auth } from '../backend/firebase/firebaseConfig';
import { checkPermission, isProjectOwner } from '../utils/permissions';
import { updateCollaboratorAccessLevel, removeCollaboratorFromProject } from "../backend/firebase/collaborationDB";

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
            typeof goal === 'string' ? { text: goal, completed: false } : goal
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
        console.error('Error loading project:', err);
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
        console.error('Error loading project:', err);
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
        console.error('Error loading folders:', err);
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
        console.error('Error loading review requests:', err);
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
        console.error('Error loading pending invitations:', err);
        // Don't show error modal for this as it's not critical
      }
    };

    if (projectId) {
      loadPendingInvitations();
    }
  }, [projectId]);


  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      setModalOpen(true);
      setStatusMessage("Project deleted successfully");
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

      await Promise.all(invitationPromises);
      
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
      console.error("Error inviting collaborators:", err);
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
      console.error("Error updating collaborator access:", err);
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
      console.error("Error removing collaborator:", err);
      setModalOpen(true);
      setError(true);
      setStatusMessage("Failed to remove collaborator");
    }
  };

  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (isEditing) {
    return (
      <main className="p-6">
        <button 
          onClick={() => setIsEditing(false)}
          className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to Details
        </button>
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
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center mr-3"
                >
                  <FiArrowLeft className="text-xl mr-2" />
                  Back
                </button>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent truncate max-w-[200px] sm:max-w-none">
                  {project.title}
                </h1>
              </div>
              <nav className="flex gap-2 justify-start sm:justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Project
                </button>
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
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Discussion</h2>
              <section className="space-y-4">
                <article className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <header className="flex items-center mb-3">
                    <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-blue-700 font-medium text-sm sm:text-base">Project Discussion Coming Soon!</h3>
                  </header>
                  <p className="text-sm text-gray-600">
                    Stay tuned for our new discussion features that will allow you to:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-600 mt-2">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Communicate with team members in real-time</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Share updates and announcements</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Create topic-based discussion threads</span>
                    </li>
                  </ul>
                </article>
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-600 rounded-lg bg-blue-50 opacity-50 cursor-not-allowed text-sm sm:text-base"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18-9-2zm0 0v-8" />
                  </svg>
                  Start Discussion (Coming Soon)
                </button>
              </section>
            </section>

            {/* Collaborators Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
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
              </div>

              {/* Active Collaborators */}
              {project.collaborators && project.collaborators.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Active Collaborators</h3>
                  <div className="space-y-3">
                    {project.collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">{collaborator.fullName}</p>
                            <p className="text-sm text-gray-500">{collaborator.institution || 'No institution'}</p>
                          </div>
                        </div>
                        {isProjectOwner(project) && (
                          <div className="flex items-center gap-2">
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
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Invitations */}
              {pendingInvitations && pendingInvitations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Invitations</h3>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.invitationId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{invitation.researcherName}</p>
                            <p className="text-xs text-gray-500">Invited: {formatDate(invitation.createdAt)}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Pending Response
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!project.collaborators || project.collaborators.length === 0) && (!pendingInvitations || pendingInvitations.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No collaborators yet</p>
              )}
            </section>

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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <motion.article
              className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete Project?</h2>
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
          </div>
        )}
      </AnimatePresence>

    </main>
  </>
  );
}
