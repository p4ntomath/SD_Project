import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject } from '../backend/firebase/projectDB';
import { ClipLoader } from 'react-spinners';
import StatusModal from '../components/StatusModal';
import CreateProjectForm from '../components/CreateProjectForm';

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
    if (window.confirm("Are you sure you want to delete this project?")) {
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
    return Math.round((completed / project.goals.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl text-red-600">Error: {error}</h2>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl">Project not found</h2>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with actions */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-blue-600 transition-colors flex items-center"
          >
            <FiArrowLeft className="text-xl mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main Info */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">Overall Progress</p>
                    <p className="text-sm font-medium">{calculateProgress()}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Research Field</p>
                  <p className="font-medium">{project.researchField}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{project.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{project.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {project.status || 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            {/* Goals Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Project Goals</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {project.goals?.map((goal, index) => (
                  <div
                    key={index}
                    onClick={() => toggleGoalStatus(index)}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        className="h-4 w-4 text-blue-600 rounded"
                        onChange={() => {}} // Handled by parent div click
                      />
                      <span className={`${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {goal.text}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      goal.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Project Documents</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{project.title} Documents</p>
                    <p className="text-sm text-gray-500">Project files and resources</p>
                  </div>
                </div>
                <button className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload New Document
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Funding Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Funding Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Available Funds</p>
                  <p className="text-2xl font-bold text-green-600">
                    R {(project.availableFunds || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Used Funds</p>
                  <p className="text-xl font-semibold text-red-600">
                    R {(project.usedFunds || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remaining Funds</p>
                  <p className="text-lg font-medium text-blue-600">
                    R {((project.availableFunds || 0) - (project.usedFunds || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${project.availableFunds ? ((project.usedFunds || 0) / project.availableFunds * 100) : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {project.availableFunds ? ((project.usedFunds || 0) / project.availableFunds * 100).toFixed(1) : 0}% utilized
                  </p>
                </div>
                <button
                  onClick={() => navigate('/trackfunding')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Track Funding
                </button>
              </div>
            </div>

            {/* Message Board Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Project Discussion</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-blue-700 font-medium">Project Discussion Coming Soon!</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Stay tuned for our new discussion features that will allow you to:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Communicate with team members in real-time
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Share updates and announcements
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Create topic-based discussion threads
                      </li>
                    </ul>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-600 rounded-lg bg-blue-50 opacity-50 cursor-not-allowed"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Start Discussion (Coming Soon)
                </button>
              </div>
            </div>

            {/* Collaborators Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Project Collaborators</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    Collaboration features are coming soon! You'll be able to:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Invite researchers to collaborate
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Share project documents
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Track shared progress
                    </li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <button
                    disabled
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Collaborators (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        success={!error}
        message={statusMessage}
      />
    </div>
  );
}
