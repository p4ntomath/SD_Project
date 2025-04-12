import { useEffect, useState } from "react";
import CreateProjectForm from "../components/CreateProjectForm";
import SideBar from "../components/ResearcherComponents/SideBar";
import SidebarToggle from "../components/ResearcherComponents/SidebarToggle";
import { logOut } from "../backend/firebase/authFirebase";
import {
  createProject,
  fetchProjects,
  deleteProject,
} from "../backend/firebase/projectDB";
import { auth } from "../backend/firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function ResearcherHomePage() {

  /*Mahlatse, this routing for click button on View Project */
  const navigate = useNavigate();

  const goToProject = (id) => {
    navigate(`/project/${id}`);
  };

  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

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
  }, [projects.length]);

  const handleCreateProject = async (newProject) => {
    try {
      await createProject(newProject);
      setProjects([...projects, newProject]);
      setShowForm(false);
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const options = { year: "numeric", month: "short", day: "numeric" };
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const updateProject = () => {
    console.warn("Update functionality not yet implemented.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <SidebarToggle isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        } p-4 md:p-8`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              My Research Projects
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 md:px-2 rounded-lg text-sm md:text-base transition-colors"
                disabled={showForm}
              >
                Create New Project
              </button>
            </div>
          </div>

          {!showForm ? (
            loading ? (
              <div className="flex justify-center items-center py-20 space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {projects.map((project, index) => (
                      <div
                        key={index}
                        className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                              {project.title}
                            </h2>
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {project.researchField}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {formatFirebaseDate(project.createdAt)}
                          </div>
                        </div>

                        <p className="mt-3 text-gray-600">
                          {project.description}
                        </p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-1">
                              Project Timeline
                            </h3>
                            <p>
                              <span className="text-gray-600">Start:</span>{" "}
                              {formatDate(project.startDate)}
                              <br />
                              <span className="text-gray-600">End:</span>{" "}
                              {formatDate(project.endDate)}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-700 mb-1">
                              Contact
                            </h3>
                            <p className="text-gray-600">{project.contact}</p>
                          </div>
                        </div>

                        {project.goals && project.goals.length > 0 && (
                          <div className="mt-4">
                            <h3 className="font-medium text-gray-700 mb-2">
                              Project Goals
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {project.goals.map((goal, i) => (
                                <li key={i}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex space-x-4 mt-4">
                          <button
                            onClick={() =>
                              navigate(`/pages/${project.id}`)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                          >
                            View Project
                          </button>
                          <button
                            onClick={() => updateProject()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                          >
                            Update Project
                          </button>
                          <button
                            onClick={async () =>
                              handleDeleteProject(project.id)
                            }
                            className="bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                          >
                            Delete Project
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      No projects yet
                    </h3>
                    <p className="mt-1 text-gray-500">
                      Get started by creating a new research project.
                    </p>
                  </div>
                )}
              </>
            )
          ) : (
            <CreateProjectForm
              onCreate={handleCreateProject}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
