import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { fetchProject, updateProject, deleteProject } from '../backend/firebase/projectDB';
import { ClipLoader } from 'react-spinners';
import StatusModal from '../components/StatusModal';

export default function ProjectDetailsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(state || null);
  const [loading, setLoading] = useState(!state);
  const [isModalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);

  useEffect(() => {
    const getProject = async () => {
      if (!state && projectId) {
        try {
          setLoading(true);
          const projectData = await fetchProject(projectId);
          // Initialize goals with completed status if not present
          if (projectData.goals) {
            projectData.goals = projectData.goals.map(goal => 
              typeof goal === 'string' ? { text: goal, completed: false } : goal
            );
          }
          setProject(projectData);
        } catch (error) {
          console.error('Error fetching project:', error);
        } finally {
          setLoading(false);
        }
      } else if (state && state.goals) {
        // Initialize goals with completed status for state data
        const initializedGoals = state.goals.map(goal => 
          typeof goal === 'string' ? { text: goal, completed: false } : goal
        );
        setProject({ ...state, goals: initializedGoals });
      }
    };

    getProject();
  }, [projectId, state]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProject(project.id);
      setIsSuccess(true);
      setStatusMessage('Project successfully deleted');
      setModalOpen(true);
      // Navigate back after successful deletion
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      setIsSuccess(false);
      setStatusMessage('Failed to delete project: ' + error.message);
      setModalOpen(true);
    }
  };

  const handleUpdate = async () => {
    if (!editedProject) return;
    
    try {
      // Create updatedProject object that preserves existing data
      const updatedProject = {
        ...project,  // Keep all existing project data
        ...editedProject,  // Override with edited values
        id: project.id,  // Ensure ID is preserved
        userId: project.userId  // Ensure userId is preserved
      };
      
      await updateProject(project.id, updatedProject);
      setProject(updatedProject);
      setIsSuccess(true);
      setStatusMessage('Project successfully updated');
      setModalOpen(true);
      setIsEditing(false);
    } catch (error) {
      setIsSuccess(false);
      setStatusMessage('Failed to update project: ' + error.message);
      setModalOpen(true);
    }
  };

  const handleEdit = () => {
    setEditedProject({ ...project });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoalToggle = async (index) => {
    const updatedProject = { ...project };
    updatedProject.goals[index].completed = !updatedProject.goals[index].completed;
    
    // Check if all goals are completed
    const allGoalsCompleted = updatedProject.goals.every(goal => goal.completed);
    if (allGoalsCompleted) {
      updatedProject.status = 'Complete';
    } else {
      updatedProject.status = 'In Progress';
    }
    
    try {
      await updateProject(project.id, updatedProject);
      setProject(updatedProject);
    } catch (error) {
      console.error('Error updating goal:', error);
      setIsSuccess(false);
      setStatusMessage('Failed to update goal: ' + error.message);
      setModalOpen(true);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ClipLoader color="#3B82F6" size={50} />
      </section>
    );
  }

  if (!project) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center">
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/home')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Return to Home
          </button>
        </section>
      </section>
    );
  }

  const completedGoals = project.goals.filter(goal => goal.completed).length;
  const progressPercentage = (completedGoals / project.goals.length) * 100;

  return (
    <section className="min-h-screen bg-gray-50">
      <StatusModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        message={statusMessage}
        success={isSuccess}
      />
      
      {/* header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <section className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <FiArrowLeft className="text-gray-600 text-2xl" />
          </button>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
            {project.title}
          </h1>
        </section>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <article className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Project Header */}
          <section className="flex justify-between items-start mb-6">
            <section>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={editedProject.title}
                  onChange={handleInputChange}
                  className="text-2xl font-bold text-gray-800 mb-2 p-1 border rounded"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{project.title}</h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  name="researchField"
                  value={editedProject.researchField}
                  onChange={handleInputChange}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border"
                />
              ) : (
                <p className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {project.researchField}
                </p>
              )}
            </section>
            <section className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    aria-label="Edit project"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Delete project"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </section>
          </section>

          {/* Project Description */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            {isEditing ? (
              <textarea
                name="description"
                value={editedProject.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg text-gray-600"
                rows="4"
              />
            ) : (
              <p className="text-gray-600">{project.description}</p>
            )}
          </section>

          {/* Project Goals with Progress Bar */}
          {project.goals && project.goals.length > 0 && (
            <section className="mb-8">
              <section className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Project Goals</h3>
                <p className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</p>
              </section>

              {/* Progress Bar */}
              <section className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <section 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </section>

              {/* Goals List */}
              <ul className="space-y-2">
                {project.goals.map((goal, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() => handleGoalToggle(index)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`text-gray-600 ${goal.completed ? 'line-through' : ''}`}>
                      {typeof goal === 'string' ? goal : goal.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Project Details Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Duration</h4>
              <p className="text-gray-800">{project.duration}</p>
            </section>

            {/* Status */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              <p className="text-gray-800">{project.status || 'In Progress'}</p>
            </section>

            {/* Available Funds */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Available Funds</h4>
              <p className="text-gray-800">R {(project.availableFunds || 0).toLocaleString()}</p>
            </section>

            {/* Used Funds */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Used Funds</h4>
              <p className="text-gray-800">R {(project.usedFunds || 0).toLocaleString()}</p>
            </section>
          </section>
        </article>
      </main>
    </section>
  );
}