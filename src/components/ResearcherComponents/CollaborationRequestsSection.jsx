import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSentInvitations, getReceivedInvitations, respondToResearcherInvitation } from '../../backend/firebase/collaborationDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { notify } from '../../backend/firebase/notificationsUtil'; // Make sure this import is present
import {getUserById} from '../../backend/firebase/notificationsUtil'; // Adjust the import based on your file structure


export default function CollaborationRequestsSection() {
  const navigate = useNavigate();
  const [sentInvitations, setSentInvitations] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [expandedInvitation, setExpandedInvitation] = useState(null);
  const [page, setPage] = useState(1);
  const [showSent, setShowSent] = useState(false);
  const itemsPerPage = 3;

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setSentInvitations([]);
          setReceivedInvitations([]);
          return;
        }

        const [sent, received] = await Promise.all([
          getSentInvitations(currentUser.uid),
          getReceivedInvitations(currentUser.uid)
        ]);

        setSentInvitations(sent || []);
        setReceivedInvitations(received || []);
      } catch (err) {
        console.error('Error loading invitations:', err);
        setError('Failed to load invitations');
        setSentInvitations([]);
        setReceivedInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvitations();
  }, []);

 const handleResponse = async (invitationId, accepted) => {
  try {
    setRespondingTo(invitationId);
    await respondToResearcherInvitation(invitationId, accepted);

    // Always get the current user's name (the one accepting/declining)
    const currentUser = auth.currentUser;
    let researcherName = "A researcher";
    if (currentUser) {
      const userProfile = await getUserById(currentUser.uid);
      researcherName = userProfile?.fullName || "A researcher";
    }

    // Find the invitation that was accepted/declined to get the requester info
    const invitation = receivedInvitations.find(inv => inv.invitationId === invitationId);

    if (invitation) {
      // Notify the requester (sender)
      await notify({
        type: 'Collaboration Request ' + (accepted ? 'Accepted' : 'Declined'),
        targetUserId: invitation.senderId, // requester userId
        projectId: invitation.projectId,
        projectTitle: invitation.projectTitle,
        researcherName,
        message: `Your collaboration request for project "${invitation.projectTitle}" was ${accepted ? 'accepted' : 'declined'} by ${researcherName}.`
      });
    }

    if (accepted && invitation) {
      navigate(`/projects/${invitation.projectId}`);
      return;
    }

    setReceivedInvitations(receivedInvitations.filter(inv => inv.invitationId !== invitationId));
  } catch (err) {
    console.error('Error responding to invitation:', err);
    setError('Failed to respond to invitation');
  } finally {
    setRespondingTo(null);
  }
};

  const toggleExpand = (invitationId) => {
    setExpandedInvitation(expandedInvitation === invitationId ? null : invitationId);
  };

  const getCurrentPageItems = (items) => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-12 bg-gray-100 rounded mb-3"></div>
        <div className="h-12 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  // Handle both undefined and empty arrays
  if (!sentInvitations?.length && !receivedInvitations?.length) {
    return (
      <p className="text-gray-500 text-center py-4">No pending invitations</p>
    );
  }

  const totalPages = Math.ceil(
    (showSent ? sentInvitations.length : receivedInvitations.length) / itemsPerPage
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => {
            setShowSent(false);
            setPage(1);
            setExpandedInvitation(null);
          }}
          className={`text-sm px-4 py-2 rounded-lg transition-colors ${
            !showSent 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Received Invitations ({receivedInvitations.length})
        </button>
        <button
          onClick={() => {
            setShowSent(true);
            setPage(1);
            setExpandedInvitation(null);
          }}
          className={`text-sm px-4 py-2 rounded-lg transition-colors ${
            showSent 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sent Invitations ({sentInvitations.length})
        </button>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-y-auto max-h-[230px] pr-2 -mr-2">
          <div className="space-y-3">
            {getCurrentPageItems(showSent ? sentInvitations : receivedInvitations).map((invitation) => (
              <div 
                key={invitation.invitationId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div 
                  onClick={() => toggleExpand(invitation.invitationId)}
                  className="p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {invitation.projectTitle}
                    </p>
                    <p className="text-sm text-gray-600">
                      {showSent ? `To: ${invitation.researcherName}` : `From: ${invitation.senderName}`}
                    </p>
                  </div>
                  {expandedInvitation === invitation.invitationId ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {expandedInvitation === invitation.invitationId && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    {!showSent && (
                      <>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Description:</p>
                          <p className="text-sm text-gray-600 mt-1">{invitation.projectDescription}</p>
                        </div>
                        {invitation.projectMilestones?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Milestones:</p>
                            <ul className="mt-1 space-y-1">
                              {invitation.projectMilestones.slice(0, 3).map((milestone, index) => (
                                <li key={index} className="text-sm text-gray-600 flex">
                                  <span className="mr-2">•</span>
                                  <span>{milestone.text}</span>
                                </li>
                              ))}
                              {invitation.projectMilestones.length > 3 && (
                                <li className="text-sm text-gray-500">
                                  +{invitation.projectMilestones.length - 3} more...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResponse(invitation.invitationId, true);
                            }}
                            disabled={respondingTo === invitation.invitationId}
                            className="px-4 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResponse(invitation.invitationId, false);
                            }}
                            disabled={respondingTo === invitation.invitationId}
                            className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </>
                    )}
                    {showSent && (
                      <div className="text-sm text-gray-600">
                        <p>Sent to: {invitation.researcherName}</p>
                        <p>Institution: {invitation.researcherInstitution}</p>
                        <p className="mt-2">Status: <span className="text-yellow-600 font-medium">Pending Response</span></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}