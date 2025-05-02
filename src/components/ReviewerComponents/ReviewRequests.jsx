import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { getReviewerRequests, updateReviewRequestStatus } from '../../backend/firebase/reviewdb';
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
        const reviewerId = auth.currentUser?.uid;
        if (!reviewerId) return;
        
        const reviewRequests = await getReviewerRequests(reviewerId);
        setRequests(reviewRequests);
      } catch (err) {
        console.error('Error loading review requests:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    try {
      // Handle Firebase Timestamp
      if (typeof timestamp === 'object' && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      // Handle regular Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      // Handle date string
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await updateReviewRequestStatus(requestId, 'accepted');
      // Update local state to reflect the change
      const updatedRequest = requests.find(req => req.id === requestId);
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      ));
      // Navigate to the project details page
      navigate(`/project/${updatedRequest.projectId}`);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await updateReviewRequestStatus(requestId, 'rejected');
      // Update local state to reflect the change
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ));
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
      <div className="text-center py-12">
        <p className="text-red-600">Error loading review requests: {error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <article className="bg-white p-8 rounded-lg shadow-md text-center max-w-7xl mx-auto">
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
              <p>Requested: {formatDate(request.requestedAt)}</p>
              <p>Status: <span className="capitalize">{request.status}</span></p>
            </div>
            {request.status === 'pending' && (
              <>
                <div className="mb-4 text-sm bg-blue-50 p-3 rounded-lg text-blue-700">
                  <p>
                    Declining a review request means you're opting out of reviewing this project. 
                    This is different from accepting the request and later submitting a negative review.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Decline Task
                  </button>
                </div>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}