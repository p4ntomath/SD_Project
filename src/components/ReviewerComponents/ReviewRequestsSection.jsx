import { useState, useEffect } from 'react';
import { auth } from '../../backend/firebase/firebaseConfig';
import { fetchReviewRequests, respondToInvitation } from '../../backend/firebase/reviewerDB';

export default function ReviewRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const reviewRequests = await fetchReviewRequests(userId);
        setRequests(reviewRequests);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const handleResponse = async (invitationId, accepted) => {
    setRespondingTo(invitationId);
    try {
      await respondToInvitation(invitationId, accepted);
      // Remove the request from the list
      setRequests(requests.filter(req => req.invitationId !== invitationId));
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <section role="status" aria-label="Loading review requests" className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </section>
    );
  }

  if (error) {
    return (
      <section role="alert" className="text-red-600 text-center p-8">
        Error loading review requests: {error}
      </section>
    );
  }

  if (requests.length === 0) {
    return (
      <section aria-label="No review requests" className="text-center p-8">
        <figure>
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </figure>
        <h2 className="mt-2 text-sm font-medium text-gray-900">No review requests</h2>
        <p className="mt-1 text-sm text-gray-500">
          You don't have any pending review requests at the moment.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-label="Review requests list">
      {requests.map((request) => (
        <article 
          key={request.invitationId} 
          className="bg-white rounded-lg shadow p-6 border border-gray-200 overflow-hidden"
        >
          <div className="overflow-y-auto max-h-[230px] pr-2 -mr-2 no-scrollbar">
            <header className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">{request.project?.title}</h2>
              <time 
                dateTime={request.createdAt instanceof Date ? request.createdAt.toISOString() : new Date(request.createdAt?.seconds * 1000).toISOString()} 
                className="text-sm text-gray-500"
              >
                Requested on {formatDate(request.createdAt)}
              </time>
            </header>

            <section className="mb-4">
              <h3 className="text-sm font-medium text-gray-700">Project Description</h3>
              <p className="mt-1 text-gray-600">{request.project?.description}</p>
            </section>
          </div>

          <footer className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Would you like to review this project? Accepting means you'll have access to review the full project details and submit your evaluation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                aria-label="Accept review task"
                onClick={() => handleResponse(request.invitationId, true)}
                disabled={respondingTo === request.invitationId}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {respondingTo === request.invitationId ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" role="status" aria-label="Processing"></span>
                    Processing...
                  </span>
                ) : (
                  'Accept Review Task'
                )}
              </button>
              <button
                type="button"
                aria-label="Decline review task"
                onClick={() => handleResponse(request.invitationId, false)}
                disabled={respondingTo === request.invitationId}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {respondingTo === request.invitationId ? 'Processing...' : 'Decline Review Task'}
              </button>
            </div>
          </footer>
        </article>
      ))}
    </section>
  );
}