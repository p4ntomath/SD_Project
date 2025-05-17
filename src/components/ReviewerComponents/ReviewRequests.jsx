import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { getReviewerRequests, updateReviewRequestStatus } from '../../backend/firebase/reviewerDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';


export default function ReviewRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const reviewerId = auth.currentUser?.uid;
        if (!reviewerId) return;
        
        const reviewRequests = await getReviewerRequests(reviewerId);
        console.log('Loaded review requests:', reviewRequests);
        // Filter out non-pending requests here if needed
        const pendingRequests = reviewRequests.filter(req => req.status === 'pending');
        setRequests(pendingRequests);
      } catch (err) {
        console.error('Error loading review requests:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
    
    // Set up an interval to refresh requests periodically
    const refreshInterval = setInterval(loadRequests, 30000); // Refresh every 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const handleAcceptRequest = async (requestId, projectId) => {
    try {
      await updateReviewRequestStatus(requestId, 'accepted');
      // Update local state to reflect the change
      setRequests(requests.filter(req => req.id !== requestId));
      // Navigate to the project details page
      navigate(`/reviewer/review/${projectId}`);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await updateReviewRequestStatus(requestId, 'rejected');
      // Update local state to reflect the change
      setRequests(requests.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <ClipLoader color="#3B82F6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        Error: {error}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <article className="bg-white rounded-xl shadow-md text-center p-8">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No pending review requests
        </h3>
        <p className="mt-1 text-gray-500">
          New review requests will appear here
        </p>
      </article>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <article
          key={request.id}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {request.projectTitle}
            </h3>
            <div className="text-sm text-gray-500 space-y-2 mb-4">
              <p>From: {request.researcherName}</p>
              <p>Requested: {new Date(request.requestedAt.seconds * 1000).toLocaleDateString()}</p>
              <p>Status: <span className="capitalize">{request.status}</span></p>
            </div>
            {request.status === 'pending' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleAcceptRequest(request.id, request.projectId)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept Request
                </button>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Decline Request
                </button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}