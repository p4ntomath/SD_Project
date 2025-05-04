import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getReviewerRequests, updateReviewRequestStatus } from '../../backend/firebase/reviewdb';
import { fetchProject } from '../../backend/firebase/projectDB';
import { ClipLoader } from 'react-spinners';
import ReviewerMainNav from '../../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';

export default function ReviewRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null); // Track which request is being processed
  const navigate = useNavigate();

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          navigate('/login');
          return;
        }

        // Get review requests
        const reviewRequests = await getReviewerRequests(userId);
        
        // Only process pending requests
        const pendingRequests = reviewRequests.filter(req => req.status === 'pending');
        
        // Fetch full project details for each request
        const requestsWithProjects = await Promise.all(
          pendingRequests.map(async (request) => {
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
        
        setRequests(requestsWithProjects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    try {
      if (typeof timestamp === 'object' && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
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

  const handleAccept = async (projectId, requestId) => {
    try {
      setProcessingId(requestId);
      await updateReviewRequestStatus(requestId, 'accepted');
      setStatusMessage('Review request accepted successfully');
      navigate(`/reviewer/review/${projectId}`);
    } catch (err) {
      setError('Failed to accept review request: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);
      await updateReviewRequestStatus(requestId, 'rejected');
      setStatusMessage('Review request rejected');
      setRequests(requests.filter(request => request.id !== requestId));
    } catch (err) {
      setError('Failed to reject review request: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" aria-label="Loading" role="status" />
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
            <h1 className="text-2xl font-bold text-gray-900">Pending Review Requests</h1>
            <p className="mt-1 text-sm text-gray-500">Review requests awaiting your response</p>
          </div>

          {statusMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-700">
              {statusMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
              {error}
            </div>
          )}

          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending review requests</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any pending review requests at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((request) => (
                <article 
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {request.project?.title || request.projectTitle}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <h3 className="font-medium text-gray-500">Research Field</h3>
                        <p className="text-gray-900">{request.project?.researchField || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-500">Researcher</h3>
                        <p className="text-gray-900">{request.researcherName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-500">Request Date</h3>
                        <p className="text-gray-900">
                          {formatDate(request.requestedAt)}
                        </p>
                      </div>
                      {request.project?.deadline && (
                        <div>
                          <h3 className="font-medium text-gray-500">Deadline</h3>
                          <p className="text-gray-900">
                            {formatDate(request.project.deadline)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-500 mb-1">Description</h3>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {request.project?.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.projectId, request.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Accepting...
                          </span>
                        ) : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Declining...
                          </span>
                        ) : 'Decline'}
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