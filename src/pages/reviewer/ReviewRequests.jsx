import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getReviewerRequests, updateReviewRequestStatus } from '../../backend/firebase/reviewerDB';
import { fetchProject } from '../../backend/firebase/projectDB';
import { ClipLoader } from 'react-spinners';
import ReviewerMainNav from '../../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';
import { notify } from '../../backend/firebase/notificationsUtil';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../backend/firebase/firebaseConfig';


export default function ReviewRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
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
              let projectData;
              // If project data is already present (for testing), use it
              if (request.project) {
                projectData = request.project;
              } else {
                projectData = await fetchProject(request.projectId);
                console.log('Fetched project data:', projectData);
              }
              return {
                ...request,
                project: projectData,
                projectTitle: projectData.title || request.projectTitle
              };
            } catch (err) {
              console.error(`Error fetching project ${request.projectId}:`, err);
              return {
                ...request,
                project: null,
                projectTitle: request.projectTitle
              };
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

      const request = requests.find(req => req.id === requestId);
      const project = await fetchProject(request.projectId);
      const researcherId = project.userId;

      // Fetch reviewer name using reviewerId from the request
      let reviewerName = 'Reviewer';
      if (request.reviewerId) {
        const reviewerDoc = await getDoc(doc(project._firestore || project.firestore || db, 'users', request.reviewerId));
        reviewerName = reviewerDoc.exists() ? reviewerDoc.data().fullName || reviewerDoc.data().displayName || 'Reviewer' : 'Reviewer';
      }

      // 1. Notify the reviewer (yourself)
      notify({
        type: 'Reviewer Accepted',
        projectId,
        projectTitle: request?.projectTitle,
        reviewerName,
        researcherName: request?.researcherName,
        targetUserId: auth.currentUser?.uid,
        senderUserId: auth.currentUser?.uid,
      });

      // 2. Notify the researcher
      notify({
        type: 'Reviewer Request Accepted',
        projectId,
        projectTitle: request?.projectTitle,
        reviewerName,
        researcherName: request?.researcherName,
        targetUserId: researcherId,
        senderUserId: auth.currentUser?.uid,
      });

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

      const request = requests.find(req => req.id === requestId);
      const project = await fetchProject(request.projectId);
      const researcherId = project.userId;

      // Fetch reviewer name using reviewerId from the request
      let reviewerName = 'Reviewer';
      if (request.reviewerId) {
        const reviewerDoc = await getDoc(doc(project._firestore || project.firestore || db, 'users', request.reviewerId));
        reviewerName = reviewerDoc.exists() ? reviewerDoc.data().fullName || reviewerDoc.data().displayName || 'Reviewer' : 'Reviewer';
      }

      // 1. Notify the reviewer (yourself)
      notify({
        type: 'Reviewer Denied',
        projectId: request.projectId,
        projectTitle: request?.projectTitle,
        reviewerName,
        researcherName: request?.researcherName,
        targetUserId: auth.currentUser?.uid,
        senderUserId: auth.currentUser?.uid,
      });

      // 2. Notify the researcher
      notify({
        type: 'Reviewer Request Denied',
        projectId: request.projectId,
        projectTitle: request?.projectTitle,
        reviewerName,
        researcherName: request?.researcherName,
        targetUserId: researcherId,
        senderUserId: auth.currentUser?.uid,
      });

    } catch (err) {
      setError('Failed to reject review request: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <section className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" aria-label="Loading" role="status" />
      </section>
    );
  }

  return (
    <>
      <ReviewerMainNav 
        setMobileMenuOpen={setMobileMenuOpen}
        mobileMenuOpen={mobileMenuOpen}
      />
      <section className="min-h-screen bg-gray-50 py-8 pt-6">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Pending Review Requests</h1>
            <p className="mt-1 text-sm text-gray-500">Review requests awaiting your response</p>
          </section>

          {statusMessage && (
            <section className="mb-6 p-4 rounded-lg bg-green-100 text-green-700">
              {statusMessage}
            </section>
          )}

          {error && (
            <section className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
              {error}
            </section>
          )}

          {requests.length === 0 ? (
            <section className="text-center py-12 bg-white rounded-lg shadow">
              <section className="flex justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </section>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending review requests</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any pending review requests at the moment.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((request) => (
                <article 
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <section className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {request.project?.title || request.projectTitle}
                    </h2>
                    <section className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <section>
                        <h3 className="font-medium text-gray-500">Research Field</h3>
                        <p className="text-gray-900">{request.project?.researchField || 'Not specified'}</p>
                      </section>
                      <section>
                        <h3 className="font-medium text-gray-500">Researcher</h3>
                        <p className="text-gray-900">{request.researcherName}</p>
                      </section>
                      <section>
                        <h3 className="font-medium text-gray-500">Request Date</h3>
                        <p className="text-gray-900">
                          {formatDate(request.requestedAt)}
                        </p>
                      </section>
                      {request.project?.deadline && (
                        <section>
                          <h3 className="font-medium text-gray-500">Deadline</h3>
                          <p className="text-gray-900">
                            {formatDate(request.project.deadline)}
                          </p>
                        </section>
                      )}
                    </section>
                    
                    <section className="mb-4">
                      <h3 className="font-medium text-gray-500 mb-1">Description</h3>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {request.project?.description || 'No description available'}
                      </p>
                    </section>

                    <section className="flex gap-2">
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
                    </section>
                  </section>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
      <ReviewerMobileBottomNav />
    </>
  );
}