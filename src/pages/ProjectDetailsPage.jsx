import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject } from '../backend/firebase/projectDB';
import { ClipLoader } from 'react-spinners';
import StatusModal from '../components/StatusModal';
import CreateProjectForm from '../components/CreateProjectForm';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProject(projectId);
        if (projectData.goals) {
          projectData.goals = projectData.goals.map(goal =>
            typeof goal === 'string' ? { text: goal, completed: false } : goal
          );
        }
        setProject(projectData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
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
      
      await updateProject(projectId, { goals: updatedGoals });
      setProject({ ...project, goals: updatedGoals });
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
      setStatusMessage("Failed to update goal status: " + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp !== 'object') return 'Not specified';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600">Error: {error}</h2>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl">Project not found</h2>
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
          <section className="flex justify-between items-center h-16">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center"
              >
                <FiArrowLeft className="text-xl mr-2" />
                Back
              </button> 
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">{project.title}</h1>
              <nav className="flex gap-2 justify-center sm:justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
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
            {/* Basic Info Card */}
            <article className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Overview</h2>
              <section className="space-y-4">
                {/* Progress Bar */}
                <section className="mb-4 sm:mb-6">
                  <header className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">Overall Progress</p>
                    <p className="text-sm text-gray-600">{calculateProgress()}%</p>
                  </header>
                  <section className="w-full bg-gray-200 rounded-full h-2">
                    <section 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </section>
                </section>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Research Field</dt>
                    <dd className="font-medium">{project.researchField}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Duration</dt>
                    <dd className="font-medium">{project.duration}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Created</dt>
                    <dd className="font-medium">{formatDate(project.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.status || 'In Progress'}
                      </span>
                    </dd>
                  </div>
                </dl>

                <section>
                  <h3 className="text-sm text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-700">{project.description}</p>
                </section>
              </section>
            </article>

            {/* Goals Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <header className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Project Goals</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
              </header>
              
              <ul className="space-y-3">
                {project.goals?.map((goal, index) => (
                  <li
                  key={index}
                  onClick={() => toggleGoalStatus(index)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                    <div className="flex items-center  gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        className="h-4 w-4 text-blue-600 rounded"
                        onChange={() => {}}
                      />
                      <span className={`${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'} text-sm sm:text-base break-words flex-1`}>
                        {goal.text}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
                      goal.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Documents Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Documents</h2>
              <section className="space-y-4">
                <header className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{project.title} Documents</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Project files and resources</p>
                  </div>
                </header>
                <button className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-sm sm:text-base">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload New Document
                </button>
              </section>
            </section>
          </section>

          {/* Right Column - Additional Info */}
          <section className="space-y-4 sm:space-y-6">
            {/* Funding Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Funding Details</h2>
              <section className="space-y-4">
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Available Funds</dt>
                    <dd className="text-xl sm:text-2xl font-bold text-green-600">
                      R {(project.availableFunds || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Used Funds</dt>
                    <dd className="text-lg sm:text-xl font-semibold text-red-600">
                      R {(project.usedFunds || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Remaining Funds</dt>
                    <dd className="text-base sm:text-lg font-medium text-blue-600">
                      R {((project.availableFunds || 0) - (project.usedFunds || 0)).toLocaleString()}
                    </dd>
                  </div>
                </dl>
                
                <section className="pt-2">
                  <section className="w-full bg-gray-200 rounded-full h-2">
                    <section 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.availableFunds ? ((project.usedFunds || 0) / project.availableFunds * 100) : 0}%` }}
                    />
                  </section>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {project.availableFunds ? ((project.usedFunds || 0) / project.availableFunds * 100).toFixed(1) : 0}% utilized
                  </p>
                </section>

                <button
                  onClick={() => navigate('/trackfunding')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Track Funding
                </button>
              </section>
            </section>

            {/* Message Board Card */}
            <section className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Project Discussion</h2>
              <section className="space-y-4">
                <article className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <header className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
                      <svg className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Collaborators (Coming Soon)
                </button>
              </section>
            </section>
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
          <dialog
            className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <article
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md m-4 border border-gray-200"
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
            </article>
          </dialog>
        )}
      </AnimatePresence>
    </main>
  </>
  );
}
