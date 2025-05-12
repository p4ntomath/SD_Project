import React from 'react';
import { ClipLoader } from 'react-spinners';

export default function ReviewersCard({ project, reviewRequests, formatDate, setShowAssignReviewersModal }) {
  const activeReviewers = project.reviewers || [];
  const pendingRequests = reviewRequests.filter(
    request => request.status !== 'accepted' && request.status !== 'completed'
  );

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
            Feedback Submitted
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
    <section className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Project Reviewers</h2>
        <button
          onClick={() => setShowAssignReviewersModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Assign Reviewers
        </button>
      </div>

      {activeReviewers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Active Reviewers</h3>
          <ul className="space-y-2">
            {activeReviewers.map((reviewer) => (
              <li key={reviewer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{reviewer.name}</p>
                    <p className="text-xs text-gray-500">{reviewer.expertise || 'Reviewer'}</p>
                  </div>
                </div>
                {getStatusBadge(reviewer.reviewStatus)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Review Requests</h3>
          <ul className="space-y-2">
            {pendingRequests.map((request) => (
              <li key={request.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{request.reviewerName}</p>
                    <p className="text-xs text-gray-500">Requested: {formatDate(request.requestedAt)}</p>
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
      )}

      {activeReviewers.length === 0 && pendingRequests.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No reviewers assigned yet</p>
      )}
    </section>
  );
}