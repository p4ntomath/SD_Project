import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../backend/firebase/firebaseConfig';
import { getProjectDetails } from '../backend/firebase/projectDB';
import ReviewFeedbackForm from '../components/ReviewerComponents/ReviewFeedbackForm';

export default function ReviewProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await getProjectDetails(projectId);
        setProject(projectData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleFeedbackSubmitted = () => {
    navigate('/reviewer/dashboard', { 
      state: { message: 'Review feedback submitted successfully' } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">
          Error loading project: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Review Project</h1>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            {project ? (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Research Field</h3>
                      <p className="mt-1 text-gray-900">{project.researchField}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
                      <p className="mt-1 text-gray-900">{project.duration}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Deadline</h3>
                      <p className="mt-1 text-gray-900">
                        {project.deadline?.toDate?.().toLocaleDateString() || new Date(project.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="mt-1 text-gray-900">{project.status}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Review</h3>
                  <ReviewFeedbackForm
                    projectId={projectId}
                    reviewerId={auth.currentUser?.uid}
                    onSubmitComplete={handleFeedbackSubmitted}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Project not found or you don't have permission to review it.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}