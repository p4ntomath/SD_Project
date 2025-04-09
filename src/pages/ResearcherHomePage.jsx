import { useState } from 'react';
import CreateProjectForm from '../components/CreateProjectForm';
import SideBar from '../components/SideBar';
import SidebarToggle from '../components/SidebarToggle';
import { logOut } from "../backend/firebase/authFirebase";
import { updateProject } from "../backend/firebase/projectDB";
import { deleteProject } from "../backend/firebase/projectDB";

export default function ResearcherHomePage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start closed by default

  const handleCreateProject = (newProject) => {
    setProjects([...projects, newProject]);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <SidebarToggle isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8`}>

        <div className="max-w-6xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Research Projects</h1>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 md:px-6 rounded-lg text-sm md:text-base transition-colors"
                disabled={showForm}>
                Create New Project
              </button>
              
              <button 
                onClick={() => {
                  logOut();
                  window.location.href = "/login";
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg text-sm md:text-base transition-colors" >
                Log Out
              </button>
            </div>
          </div>
          
          {!showForm ? (
            <>
              {projects.length > 0 ? (
                  //show this if theres projects available

                <div className="grid grid-cols-1 gap-6">
                  {projects.map((project, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                      {/* Project content remains the same */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">{project.title}</h2>
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {project.researchField}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(project.createdAt)}
                        </div>
                      </div>
                      
                      <p className="mt-3 text-gray-600">{project.description}</p>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h3 className="font-medium text-gray-700 mb-1">Project Timeline</h3>
                          <p>
                            <span className="text-gray-600">Start:</span> {formatDate(project.startDate)}<br />
                            <span className="text-gray-600">End:</span> {formatDate(project.endDate)}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-700 mb-1">Contact</h3>
                          <p className="text-gray-600">{project.contact}</p>
                        </div>
                      </div>
                      
                      {project.goals && project.goals.length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-medium text-gray-700 mb-2">Project Goals</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {project.goals.map((goal, i) => (
                              <li key={i}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex space-x-4 mt-4">
                        <button 
                          onClick={() => updateProject()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                          Update Project
                        </button>
                        <button 
                          onClick={() => deleteProject()}
                          className="bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                          Delete Project
                        </button>
                      </div>
                    </div>
                  ))}

                </div>
              ) : (
                  //show this if theres no projects available
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No projects yet</h3>
                  <p className="mt-1 text-gray-500">Get started by creating a new research project.</p>
                </div>
              )}
            </>
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