import React, { useState, useEffect } from 'react';
import AssignReviewersModal from '../ResearcherComponents/AssignReviewersModal';
import { auth } from '../../backend/firebase/firebaseConfig';
import { createReviewRequest, getReviewerRequestsForProject } from '../../backend/firebase/reviewerDB';
import { isProjectOwner, checkPermission } from '../../utils/permissions';

export default function ReviewersCard({ project, reviewRequests, formatDate, setReviewRequests, projectId, setModalOpen, setStatusMessage, setError }) {
  const [showAssignReviewersModal, setShowAssignReviewersModal] = useState(false);
  const [sendingReviewRequests, setSendingReviewRequests] = useState(false);
  const [processingReRequest, setProcessingReRequest] = useState(null);
  const activeReviewers = project.reviewers || [];
  const pendingRequests = (reviewRequests || []).filter(
    request => request.status !== 'accepted' && request.status !== 'completed'
  );

  // Check if current user can manage reviewers
  const canManageReviewers = isProjectOwner(project) || checkPermission(project, 'canManageReviewers');

  // Helper function to check if a reviewer has pending requests
  const hasReviewerPendingRequest = (reviewerId) => {
    return (reviewRequests || []).some(request => 
      request.reviewerId === reviewerId && 
      (request.status === 'pending' || request.status === 'accepted')
    );
  };

    useEffect(() => {
      if (!showAssignReviewersModal) {
        // Reset sending state when modal is closed
        setSendingReviewRequests(false);
      }
    }, [showAssignReviewersModal]);

  const handleAssignReviewers = async (selectedReviewers) => {
    try {
      setSendingReviewRequests(true);
      // Create reviewer requests in the reviewRequests collection
      const reviewerPromises = selectedReviewers.map(reviewer => 
        createReviewRequest(
          projectId, 
          reviewer.id,
          project.title,
          auth.currentUser.displayName || 'Researcher'
        )
      );

      await Promise.all(reviewerPromises);
      
      // Reload review requests to update UI
      const updatedRequests = await getReviewerRequestsForProject(projectId);
      setReviewRequests(updatedRequests);

      setShowAssignReviewersModal(false);
      setModalOpen(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Successfully sent {selectedReviewers.length} reviewer request{selectedReviewers.length !== 1 ? 's' : ''}</span>
        </div>
      );
      setError(false);
    } catch (err) {
      console.error("Error assigning reviewers:", err);
      setError(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-red-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Failed to send reviewer requests: {err.message}</span>
        </div>
      );
    } finally {
      setSendingReviewRequests(false);
    }
  };

  const handleReRequest = async (reviewer) => {
    try {
      // Check if reviewer already has a pending request
      if (hasReviewerPendingRequest(reviewer.id)) {
        setError(true);
        setModalOpen(true);
        setStatusMessage(
          <div className="flex items-center gap-2 text-yellow-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Cannot send new request: {reviewer.name} already has a pending review request</span>
          </div>
        );
        return;
      }

      setProcessingReRequest(reviewer.id);
      // Create new review request for the reviewer
      await createReviewRequest(
        projectId,
        reviewer.id,
        project.title,
        auth.currentUser.displayName || 'Researcher'
      );

      // Reload review requests to update UI
      const updatedRequests = await getReviewerRequestsForProject(projectId);
      setReviewRequests(updatedRequests);

      setModalOpen(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Successfully sent new review request to {reviewer.name}</span>
        </div>
      );
      setError(false);
    } catch (err) {
      console.error("Error re-requesting review:", err);
      setError(true);
      setStatusMessage(
        <div className="flex items-center gap-2 text-red-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Failed to send review request: {err.message}</span>
        </div>
      );
    } finally {
      setProcessingReRequest(null);
    }
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_feedback':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Pending Feedback
          </span>
        );
      case 'feedback_submitted':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Feedback Received
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Status Unknown
          </span>
        );
    }
  };

  return (
    <article className="bg-white rounded-lg shadow p-4 sm:p-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Project Reviewers</h2>
        {canManageReviewers && (
          <button
            onClick={() => setShowAssignReviewersModal(true)}
            disabled={sendingReviewRequests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Assign Reviewers
          </button>
        )}
      </header>

      <AssignReviewersModal
        isOpen={showAssignReviewersModal}
        onClose={() => setShowAssignReviewersModal(false)}
        onAssign={handleAssignReviewers}
        projectId={projectId}
        reviewRequests={reviewRequests}
      />

      {activeReviewers.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Active Reviewers</h3>
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <ul className="space-y-2" role="list">
              {activeReviewers.map((reviewer) => (
                <li key={reviewer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm break-words">{reviewer.name}</p>
                      <p className="text-xs text-gray-500 break-words">{reviewer.fieldOfResearch || 'No field of research specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reviewer.reviewStatus)}
                    {canManageReviewers && reviewer.reviewStatus === 'feedback_submitted' && (
                      <button
                        onClick={() => handleReRequest(reviewer)}
                        disabled={processingReRequest === reviewer.id || sendingReviewRequests}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Request another review"
                        aria-label={`Request another review from ${reviewer.name}`}
                      >
                        {processingReRequest === reviewer.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" role="status" aria-label="Processing..." />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {pendingRequests.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Review Requests</h3>
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <ul className="space-y-2" role="list">
              {pendingRequests.map((request) => (
                <li key={request.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm break-words">{request.reviewerName}</p>
                      <time className="text-xs text-gray-500 break-words" dateTime={request.requestedAt instanceof Date ? request.requestedAt.toISOString() : new Date(request.requestedAt?.seconds * 1000).toISOString()}>
                        Requested: {formatDate(request.requestedAt)}
                      </time>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status === 'pending' ? 'Pending Response' :
                     request.status === 'rejected' ? 'Request Declined' :
                     'Unknown Status'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {activeReviewers.length === 0 && pendingRequests.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No reviewers assigned yet</p>
      )}
    </article>
  );
}