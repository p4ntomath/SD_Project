import { useState } from 'react';
import ProjectForm from '../components/ProjectForm';

export default function ResearcherHomePage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const handleCreateProject = (newProject) => {
    setProjects([...projects, newProject]);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Research Projects</h1>
        
        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg  md:w-auto" 
            >
              Create New Project
            </button>

            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold">{project.title}</h2>
                    <p className="text-gray-600 mt-2">{project.description}</p>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Contact: {project.contact}</p>
                      <p>Due: {project.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No projects yet. Click the button above to create one.</p>
            )}
          </>
        ) : (
          <ProjectForm 
            onCreate={handleCreateProject}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}