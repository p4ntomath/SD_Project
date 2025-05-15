import { useEffect, useState, useRef } from 'react';
import CreateProjectForm from '../components/CreateProjectForm';
import StatusModal from '../components/StatusModal';
import { createProject, fetchProjects } from '../backend/firebase/projectDB';
import { auth } from '../backend/firebase/firebaseConfig';
import { ClipLoader } from "react-spinners";
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FiPlus } from 'react-icons/fi';
import { useNavigate } from "react-router-dom";

export const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const projectsRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projectTypeFilter, setProjectTypeFilter] = useState('all'); // 'all', 'owned', or 'collaborative'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'In Progress', 'Completed', etc.

  const fetchAllProjects = async (user) => {
    try {
      setLoading(true);
      const fetchedProjects = await fetchProjects(user.uid);
      const projectsWithInitializedGoals = fetchedProjects.map(project => ({
        ...project,
        goals: project.goals?.map(goal => 
          typeof goal === 'string' ? { text: goal, completed: false } : goal
        ) || [],
        isOwner: project.userId === user.uid
      }));
      setProjects(projectsWithInitializedGoals);
      setFilteredProjects(projectsWithInitializedGoals);
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

  const filterProjects = () => {
    let filtered = [...projects];

    // Apply project type filter
    if (projectTypeFilter !== 'all') {
      filtered = filtered.filter(project => 
        projectTypeFilter === 'owned' ? project.isOwner : !project.isOwner
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projectTypeFilter, statusFilter, projects]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCreateProject = async (newProject) => {
    if (!newProject) return;
    setCreateLoading(true);
    const { goalInput, id, ...cleanedProject } = newProject;

    try {
      const createdProjectId = await createProject(cleanedProject);
      const fullProject = {
        ...cleanedProject,
        id: createdProjectId,
        userId: auth.currentUser.uid,
        projectId: createdProjectId,
      };
      setProjects(prevProjects => [...prevProjects, fullProject]);
      setFilteredProjects(prevFiltered => [...prevFiltered, fullProject]);
      setModalOpen(true);
      setStatusMessage('Project was successfully created.');
      setShowForm(false);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Error creating project:", err);
      setModalOpen(true);
      setStatusMessage('Failed to create project. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section data-testid="my-projects" className="min-h-screen bg-gray-50 flex flex-col">
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
        <section className="max-w-6xl mx-auto">
          <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Projects</h1>
            <section className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <select
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                <option value="owned">My Projects</option>
                <option value="collaborative">Collaborations</option>
              </select>
              <select
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center"
                disabled={showForm}
                aria-label="create new research project"
              >
                <FiPlus className="mr-2" />
                Create Project
              </button>
            </section>
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
                  <section ref={projectsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <article 
                        key={project.id} 
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer"
                        onClick={() => {
                          if (project.id) {
                            navigate(`/projects/${project.id}`, {
                              state: project
                            });
                          }
                        }}
                      >
                        <section className="flex justify-between items-start">
                          <section>
                            <h2 className="text-xl font-semibold text-gray-800">{project.title}</h2>
                            <p className="mt-2 text-gray-600 break-all">{project.description}</p>
                          </section>
                          <div 
                            className={`h-4 w-4 rounded-full border-2 ${
                              project.isOwner 
                                ? 'bg-blue-500 border-blue-600' 
                                : 'bg-green-500 border-green-600'
                            }`}
                            title={project.isOwner ? 'Owner' : 'Collaborator'}
                          />
                        </section>
                        <section className="flex items-center justify-between mt-4">
                          <p className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                            {project.researchField}
                          </p>
                          <p className="text-sm text-gray-500">Status: {project.status}</p>
                        </section>

                        {project.goals && project.goals.length > 0 && (
                          <section className="mt-4">
                            <section className="flex justify-between items-center mb-2">
                              <p className="text-sm text-gray-600">Progress</p>
                              <p className="text-sm text-gray-600">
                                {Math.round((project.goals.filter(goal => goal.completed).length / project.goals.length) * 100)}%
                              </p>
                            </section>
                            <section className="w-full bg-gray-200 rounded-full h-2">
                              <section 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ 
                                  width: `${(project.goals.filter(goal => goal.completed).length / project.goals.length) * 100}%` 
                                }}
                              />
                            </section>
                          </section>
                        )}
                      </article>
                    ))}
                  </section>
                ) : (
                  <section className="bg-white p-8 rounded-lg shadow-md text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      {searchQuery ? 'No matching projects found' : 'No projects yet'}
                    </h3>
                    <p className="mt-1 text-gray-500">
                      {searchQuery ? 'Try a different search term or filter' : 'Get started by creating a new research project.'}
                    </p>
                  </section>
                )}
              </>
            )
          ) : (
            <CreateProjectForm
              onCreate={handleCreateProject}
              loading={createLoading}
              onCancel={() => setShowForm(false)}
            />
          )}
        </section>
      </main>

      <footer>
        <MobileBottomNav showForm={showForm} setShowForm={setShowForm} />
      </footer>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        success={true}
        message={statusMessage}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      />
    </section>
  );
}