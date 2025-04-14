import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProjectById, searchResearchers, addCollaboratorToProject } from "../backend/firebase/projectDB"; // Import the new function

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCollaboratorSearch, setShowCollaboratorSearch] = useState(false);
  const [researchers, setResearchers] = useState([]);  // To hold the list of all researchers
  const [filteredResearchers, setFilteredResearchers] = useState([]);  // To hold the filtered list
  const [searchTerm, setSearchTerm] = useState("");  // Search term for the input

  // Fetch all researchers initially
  const fetchResearchers = async () => {
    try {
      const allResearchers = await searchResearchers("",project.userId,project); // Get all researchers initially
      setResearchers(allResearchers);
      setFilteredResearchers(allResearchers); // Initialize with all researchers
    } catch (error) {
      console.error("Error fetching researchers:", error);
    }
  };

  // Handle the search and filter the list of researchers
  const handleSearch = (term) => {
    console.log(project.userId);
    setSearchTerm(term, project.userId, project);
    if (term === "") {
      setFilteredResearchers(researchers); // Show all if search is empty
    } else {
      // Filter researchers based on the name
      const filtered = researchers.filter((researcher) =>
        (researcher.first_name || "")
          .toLowerCase()
          .includes((searchTerm || "").toLowerCase())
      );
      setFilteredResearchers(filtered);
    }
  };

  // When the modal opens, fetch researchers
  useEffect(() => {
    if (showCollaboratorSearch) {
      fetchResearchers();
    }
  }, [showCollaboratorSearch]);

  const addCollaborator = async (collaboratorId) => {
    try {
      //console.log("Add collaborator with ID:", collaboratorId, "Project Id:", id);
      await addCollaboratorToProject(id, collaboratorId);
    } catch (error) {
      console.error("Failed to add collaborator in addCollaborator():", error.message);
      // Optionally: Show error to user or handle it in UI
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectData = await fetchProjectById(id); // Fetch a single project by ID
        setProject(projectData);
      } catch (error) {
        console.error("Error fetching project details:", error);
        setProject(null); // Set project to null if error occurs
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!project) return <p className="p-4">Project not found.</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{project.title}</h1>
      <p className="text-gray-600 mb-2">{project.description}</p>
      <p>
        <strong>Field:</strong> {project.researchField}
      </p>
      <p>
        <strong>Start Date:</strong> {project.startDate}
      </p>
      <p>
        <strong>End Date:</strong> {project.endDate}
      </p>
      <p>
        <strong>Contact:</strong> {project.contact}
      </p>

      {project.goals?.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-700">Goals</h3>
          <ul className="list-disc list-inside text-gray-600">
            {project.goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
<button
        onClick={() => setShowCollaboratorSearch(true)}
        className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
      >
        Add Collaborator
      </button>

      {/* Search Modal for Collaborators */}
      {showCollaboratorSearch && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold text-gray-700">Search Collaborators</h3>
            
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)} // Update search term
              className="mt-2 p-2 border border-gray-300 rounded-lg w-full"
            />
            
            {/* List of Researchers */}
            <div className="mt-4">
              {filteredResearchers.length > 0 ? (
                <ul>
                  {filteredResearchers.map((researcher) => (
                    <li key={researcher.id} className="flex justify-between items-center mt-2">
                      <p className="text-gray-800 font-medium">{researcher.first_name} {researcher.last_name}</p>
                      <button
                        onClick={() => addCollaborator(researcher.id)}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-lg"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No researchers found</p>
              )}
            </div>

            <button
              onClick={() => setShowCollaboratorSearch(false)}
              className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
