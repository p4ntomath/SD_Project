import {  useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject, getProjectDetails } from '../backend/firebase/projectDB';
import {  fetchDocumentsByFolder } from '../backend/firebase/documentsDB';
import { ClipLoader } from 'react-spinners';
import StatusModal from '../components/StatusModal';
import CreateProjectForm from '../components/CreateProjectForm';
import { AnimatePresence, motion } from 'framer-motion';
import AssignReviewersModal from '../components/ResearcherComponents/AssignReviewersModal';
import ProjectReviews from '../components/ReviewerComponents/ProjectReviews';
import { createReviewRequest, getReviewerRequestsForProject } from '../backend/firebase/reviewerDB';
import { auth } from '../backend/firebase/firebaseConfig';
import { updateExistingReviewerInfo } from '../backend/firebase/reviewerDB';
import ReviewersCard from '../components/ProjectDetailsPage/ReviewersCard';
import DocumentsCard from '../components/ProjectDetailsPage/DocumentsCard';
import FundingCard from '../components/ProjectDetailsPage/FundingCard';
import GoalsCard from '../components/ProjectDetailsPage/GoalsCard';
import BasicInfoCard from '../components/ProjectDetailsPage/BasicInfoCard';

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
  const [sendingReviewRequests, setSendingReviewRequests] = useState(false);

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
    if (!showAssignReviewersModal) {
      // Reset loading state when modal closes
      setSendingReviewRequests(false);
    }
  }, [showAssignReviewersModal]);

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

  const toggleGoalStatus = async (goalIndex) => {
    try {
      const updatedGoals = project.goals.map((goal, index) => {
        if (index === goalIndex) {
          return { ...goal, completed: !goal.completed };
        }
        return goal;
      });
      
      // Check if all goals are completed
      const allGoalsCompleted = updatedGoals.every(goal => goal.completed);
      
      // Update both goals and status if all goals are completed
      await updateProject(projectId, { 
        goals: updatedGoals,
        status: allGoalsCompleted ? 'Complete' : 'In Progress'
      });
      
      setProject({ 
        ...project, 
        goals: updatedGoals,
        status: allGoalsCompleted ? 'Complete' : 'In Progress'
      });
      
      if (allGoalsCompleted) {
        setModalOpen(true);
        setStatusMessage("All goals completed! Project status set to Complete.");
      }
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to update goal status: " + err.message);
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


  const handleAssignReviewers = async (selectedReviewers) => {
    try {
      // Create reviewer requests in the reviewRequests collection
      const reviewerPromises = selectedReviewers.map(reviewer => 
        createReviewRequest(
          projectId, 
          reviewer.id,
          project.title,
          auth.currentUser.displayName || 'Researcher'
        )
      );

      await Promise.all(reviewerPromises);
      
      // Reload review requests to update UI
      const updatedRequests = await getReviewerRequestsForProject(projectId);
      setReviewRequests(updatedRequests);
      
      setShowAssignReviewersModal(false);
      setModalOpen(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Successfully sent {selectedReviewers.length} reviewer request{selectedReviewers.length !== 1 ? 's' : ''}</span>
        </div>
      );
      setError(false);
    } catch (err) {
      console.error("Error assigning reviewers:", err);
      setError(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-red-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Failed to send reviewer requests: {err.message}</span>
        </div>
      );
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
            />

            <GoalsCard 
              project={project}
              calculateProgress={calculateProgress}
              toggleGoalStatus={toggleGoalStatus}
            />

            <DocumentsCard 
              projectId={projectId}
              folders={folders}
              setFolders={setFolders}
              foldersLoading={foldersLoading}
              setModalOpen={setModalOpen}
              setError={setError}
              setStatusMessage={setStatusMessage}
            />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Collaborators</h2>
              <section className="space-y-4">
                <article className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-blue-700 text-xs sm:text-sm mb-2">
                    Collaboration features are coming soon! You'll be able to:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs sm:text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Invite researchers to collaborate</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Share project documents</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Track shared progress</span>
                    </li>
                  </ul>
                </article>
                <button
                  disabled
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium w-full flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Collaborators (Coming Soon)
                </button>
              </section>
            </section>

            <ReviewersCard 
              project={project}
              reviewRequests={reviewRequests}
              formatDate={formatDate}
              setShowAssignReviewersModal={setShowAssignReviewersModal}
            />
            
          </section>
        </section>

        {/* Project Reviews Card - Full Width */}
        <article className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Reviews</h2>
          <ProjectReviews projectId={projectId} formatDate={formatDate} />
        </article>

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


      <AssignReviewersModal
        isOpen={showAssignReviewersModal}
        onClose={() => setShowAssignReviewersModal(false)}
        onAssign={handleAssignReviewers}
        projectId={projectId}
      />
    </main>
  </>
  );
}
