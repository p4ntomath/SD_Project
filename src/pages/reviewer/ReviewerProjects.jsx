import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getReviewerRequests } from '../../backend/firebase/reviewerDB';
import { fetchProject } from '../../backend/firebase/projectDB';
import { ClipLoader } from 'react-spinners';
import ReviewerMainNav from '../../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';

export default function ReviewerProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          navigate('/login');
          return;
        }

        // Get review requests
        const reviewRequests = await getReviewerRequests(userId);
        
        // Only process accepted requests
        const acceptedRequests = reviewRequests.filter(req => req.status === 'accepted');
        
        // Fetch full project details for each request
        const projectsWithDetails = await Promise.all(
          acceptedRequests.map(async (request) => {
            try {
              const projectData = await fetchProject(request.projectId);
              return {
                ...request,
                project: projectData
              };
            } catch (err) {
              console.error(`Error fetching project ${request.projectId}:`, err);
              return request;
            }
          })
        );

        setProjects(projectsWithDetails);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    try {
      if (typeof timestamp === 'object' && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/reviewer/review/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </div>
    );
  }

  return (
    <>
      <ReviewerMainNav 
        setMobileMenuOpen={setMobileMenuOpen}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="min-h-screen bg-gray-50 py-8 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Approved Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Projects you've accepted for review</p>
          </div>

          {statusMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-700">
              {statusMessage}
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No approved projects</h3>
              <p className="mt-1 text-sm text-gray-500">Projects you accept for review will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <article 
                  key={project.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewProject(project.projectId)}
                >
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {project.project?.title || project.projectTitle}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <h3 className="font-medium text-gray-500">Research Field</h3>
                        <p className="text-gray-900">{project.project?.researchField || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-500">Researcher</h3>
                        <p className="text-gray-900">{project.researcherName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-500">Accepted Date</h3>
                        <p className="text-gray-900">
                          {formatDate(project.updatedAt || project.requestedAt)}
                        </p>
                      </div>
                      {project.project?.deadline && (
                        <div>
                          <h3 className="font-medium text-gray-500">Deadline</h3>
                          <p className="text-gray-900">
                            {formatDate(project.project.deadline)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-500 mb-1">Description</h3>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {project.project?.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(project.projectId);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Review Project
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      <ReviewerMobileBottomNav />
    </>
  );
}