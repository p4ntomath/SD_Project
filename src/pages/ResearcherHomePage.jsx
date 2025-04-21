import { useEffect, useState, useRef } from 'react';
import CreateProjectForm from '../components/CreateProjectForm';
import StatusModal from '../components/StatusModal';
import { createProject, fetchProjects } from "../backend/firebase/projectDB";
import { auth } from "../backend/firebase/firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

export default function ResearcherHomePage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const projectsRef = useRef(null);
  const navigate = useNavigate();

  const fetchAllProjects = async (user) => {
    try {
      setLoading(true);
      const fetchedProjects = await fetchProjects(user.uid);
      setProjects(fetchedProjects);
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
      setModalOpen(true);
      setStatusMessage('Project was successfully created.');
      setShowForm(false);
    } catch (err) {
      console.error("Error creating project:", err);
      setModalOpen(true);
      setStatusMessage('Failed to create project. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFirebaseDate = (timestamp) => {
    if (!timestamp || typeof timestamp !== "object") return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <section className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Projects</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            disabled={showForm}
          >
            Create Project
          </button>
        </section>

        {loading ? (
          <section className="flex justify-center items-center h-64">
            <ClipLoader color="#3B82F6" />
          </section>
        ) : (
          <>
            {!showForm ? (
              <>
                {projects.length > 0 ? (
                  <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <article
                        key={project.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/projects/${project.id}`, { state: project })}
                      >
                        <section>
                          <section className="mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">{project.title}</h2>
                            <p className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {project.researchField}
                            </p>
                          </section>
                          <p className="text-sm text-gray-500">
                            Created: {formatFirebaseDate(project.createdAt)}
                          </p>
                        </section>

                        <p className="mt-3 text-gray-600">{project.description}</p>

                        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <section>
                            <h3 className="font-medium text-gray-700 mb-1">Project Timeline</h3>
                            <p>
                              <p className="text-gray-600">Start:</p> {formatDate(project.startDate)}<br />
                              <p className="text-gray-600">End:</p> {formatDate(project.endDate)}
                            </p>
                          </section>
                          <section>
                            <h3 className="font-medium text-gray-700 mb-1">Contact</h3>
                            <p className="text-gray-600">{project.contact}</p>
                          </section>
                        </section>

                        {project.goals && project.goals.length > 0 && (
                          <section className="mt-4">
                            <h3 className="font-medium text-gray-700 mb-2">Project Goals</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {project.goals.map((goal, i) => (
                                <li key={i}>{goal}</li>
                              ))}
                            </ul>
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
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No projects yet</h3>
                    <p className="mt-1 text-gray-500">Get started by creating a new research project.</p>
                  </section>
                )}
              </>
            ) : (
              <CreateProjectForm
                onCreate={handleCreateProject}
                loading={createLoading}
                onCancel={() => setShowForm(false)}
              />
            )}
          </>
        )}
      </main>

      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        success={true}
        message={statusMessage}
      />
    </section>
  );
}
