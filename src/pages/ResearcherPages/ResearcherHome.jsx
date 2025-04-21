import { useEffect, useState, useRef } from 'react';
import CreateProjectForm from '../../components/CreateProjectForm';
import StatusModal from '../../components/StatusModal';
import { createProject, updateProject, fetchProjects, deleteProject } from '../../backend/firebase/projectDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import { ClipLoader } from "react-spinners";
import MainNav from '../../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FiPlus } from 'react-icons/fi';
import { FaChartLine, FaPiggyBank } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

export default function ResearcherHome() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [projectToUpdate, setProjectToUpdate] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const projectsRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);

  const fetchAllProjects = async (user) => {
    try {
      setLoading(true);
      const fetchedProjects = await fetchProjects(user.uid);
      setProjects(fetchedProjects);
      setFilteredProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAllProjects(user);
      } else {
        console.error("User not authenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  };

  const handleCreateProject = async (newProject) => {
    if (!newProject) return;
    setCreateLoading(true);
    const { goalInput, id, ...cleanedProject } = newProject;

    try {
      const createdProjectId = await createProject(cleanedProject);
      const fullProject = {
        ...cleanedProject,
        userId: auth.currentUser.uid,
        projectId: createdProjectId,
      };
      setProjects([...projects, fullProject]);
      setFilteredProjects([...filteredProjects, fullProject]);
      setShowForm(false);
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!projectId) return;
    setDeletingProjectId(projectId);
    try {
      await deleteProject(projectId);
      const updatedProjects = projects.filter((project) => project.id !== projectId);
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
      setDeletionSuccess(true);
      setStatusMessage('Project was successfully deleted.');
    } catch (error) {
      setDeletionSuccess(false);
      setStatusMessage('Failed to delete the project. Please try again.');
      console.error("Failed to delete the project. Please try again.");
    } finally {
      setDeletingProjectId(null);
      setModalOpen(true);
    }
  };

  const handleUpdateProject = async (updatedProject) => {
    if (!updatedProject) return;
    setCreateLoading(true);
    try {
      await updateProject(updatedProject.id, updatedProject);
      const updatedProjects = projects.map((project) =>
        project.id === updatedProject.id ? { ...project, ...updatedProject } : project
      );
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
      setDeletionSuccess(true);
      setStatusMessage('Project was successfully updated.');
    } catch (error) {
      setDeletionSuccess(false);
      setStatusMessage('Failed to update the project. Please try again.');
    } finally {
      setCreateLoading(false);
      setModalOpen(true);
      setProjectToUpdate(null);
      setIsUpdateMode(false);
      setCreateLoading(false);
      setShowForm(false);
      projectsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate funding totals
  const totalAvailableFunds = projects.reduce((sum, project) => sum + (project.availableFunds || 0), 0);
  const totalUsedFunds = projects.reduce((sum, project) => sum + (project.usedFunds || 0), 0);

  return (
    <section className="min-h-screen bg-gray-50 flex flex-col">
      <header>
        <MainNav 
          showForm={showForm} 
          setShowForm={setShowForm} 
          setMobileMenuOpen={setMobileMenuOpen} 
          mobileMenuOpen={mobileMenuOpen} 
          onSearch={handleSearch}
        />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
          {/* Main Projects Section */}
          <section className="flex-1">
            <section className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Projects</h1>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center"
                disabled={showForm}
                aria-label="Create new project"
              >
                <FiPlus className="mr-2" />
                Create Project
              </button>
            </section>
            
            {!showForm ? (
              loading ? (
                <section className="flex justify-center items-center py-20 space-x-2">
                  {[0, 1, 2].map((i) => (
                    <p
                      key={i}
                      className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </section>
              ) : (
                <>
                  {filteredProjects.length > 0 ? (
                    <section ref={projectsRef} className="grid grid-cols-1 gap-6">
                      {filteredProjects.map((project) => (
                        <article key={project.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                        onClick={() => navigate(`/projects/${project.id}`, {
                          state: {
                            title: project.title,
                            description: project.description,
                            status: project.status,
                            availableFunds: project.availableFunds,
                            usedFunds: project.usedFunds
                          }
                        })}>
                            <section className="flex justify-between items-start">
                              <section>
                                <h2 className="text-xl font-semibold text-gray-800">{project.title}</h2>
                                <p className="mt-2 text-gray-600">{project.description}</p>
                              </section>
                            </section>

                          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <section>
                              <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
                              <p className="text-gray-800">{project.duration}</p>
                            </section>
                            
                            <section>
                              <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                              <section className="flex items-center gap-2 mt-1">
                                <section className="w-full bg-gray-200 rounded-full h-2">
                                  <section 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    //*Implement progress tracking functions here
                                    style={{ width: '0%' }}
                                  />
                                </section >{/*Implement progress tracking functions here*/}
                                <p className="text-xs text-gray-500">0%</p> 
                              </section>

                            </section>
                          </section>

                          <section className="flex flex-wrap gap-2 mt-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsUpdateMode(true);
                                setShowForm(true);
                                setProjectToUpdate(project);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                              disabled={showForm}
                            >
                              Update
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id)
                              }}
                              className="bg-white hover:bg-gray-50 text-red-600 border border-red-600 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                              disabled={deletingProjectId === project.id}
                            >
                              {deletingProjectId === project.id ? (
                                <ClipLoader color="#dc2626" size={20} />
                              ) : (
                                "Delete"
                              )}
                            </button>
                          </section>
                        </article>
                      ))}
                    </section>
                  ) : (
                    <section className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-100">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">
                        {searchQuery ? 'No matching projects found' : 'No projects yet'}
                      </h3>
                      <p className="mt-1 text-gray-500">
                        {searchQuery ? 'Try a different search term' : 'Get started by creating a new research project.'}
                      </p>
                    </section>
                  )}
                </>
              )
            ) : (
              <CreateProjectForm
                onCreate={handleCreateProject}
                onUpdate={handleUpdateProject}
                loading={createLoading}
                onCancel={() => setShowForm(false)}
                projectToUpdate={projectToUpdate}
                isUpdateMode={isUpdateMode}
              />
            )}
          </section>

          {/* Sidebar Section */}
          <aside className="md:w-80 flex flex-col gap-6">
            {/* Funding Tracker Card */}
            <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <section className="flex items-center mb-4">
                <FaPiggyBank className="mr-2 text-pink-500 text-2xl" />
                <h2 className="text-xl font-bold text-gray-800">Project Funding</h2>
              </section>
              
              {projects.length > 0 ? (
                <section className="space-y-4">
                  <section className="flex justify-between items-center">
                    <p className="text-gray-600">Available Funds</p>
                    <p className="font-medium">R {totalAvailableFunds.toLocaleString()}</p>
                  </section>
                  <section className="flex justify-between items-center">
                    <p className="text-gray-600">Funds Used</p>
                    <p className="font-medium">R {totalUsedFunds.toLocaleString()}</p>
                  </section>

                  <section className="pt-2">
                    <button
                      onClick={() => navigate('/trackfunding')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                    >
                      <FaChartLine className="mr-2" />
                      Track Funding
                    </button>
                  </section>
                </section>
              ) : (
                <p className="text-gray-500 text-center py-4">No funding to track</p>
              )}
            </article>

            {/* Collaborators Card */}
            <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <section className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Collaborators</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <FiPlus className="inline mr-1" /> Add
                </button>
              </section>
              {projects.length > 0 ? (
                <section className="space-y-3">
                  <section className="flex items-center gap-3">
                    <figure className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <p className="text-blue-600 text-sm font-medium">JD</p>
                    </figure>
                    <p className="text-gray-700">John Doe</p>
                  </section>
                  <section className="flex items-center gap-3">
                    <figure className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <p className="text-green-600 text-sm font-medium">AS</p>
                    </figure>
                    <p className="text-gray-700">Alice Smith</p>
                  </section>
                  <button className="w-full mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium text-center">
                    View all (5)
                  </button>
                </section>
              ) : (
                <p className="text-gray-500 text-center py-4">Add a project to invite collaborators</p>
              )}
            </article>
          </aside>
        </section>
      </main>

      <footer>
        <MobileBottomNav showForm={showForm} setShowForm={setShowForm} />
      </footer>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        success={deletionSuccess}
        message={statusMessage}
      />
    </section>
  );
}