import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSentInvitations, getReceivedInvitations, respondToResearcherInvitation } from '../../backend/firebase/collaborationDB';
import { auth } from '../../backend/firebase/firebaseConfig';

export default function CollaborationRequestsSection() {
  const navigate = useNavigate();
  const [sentInvitations, setSentInvitations] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [expandedInvitation, setExpandedInvitation] = useState(null);

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const [sent, received] = await Promise.all([
          getSentInvitations(currentUser.uid),
          getReceivedInvitations(currentUser.uid)
        ]);

        setSentInvitations(sent);
        setReceivedInvitations(received);
      } catch (err) {
        console.error('Error loading invitations:', err);
        setError('Failed to load invitations');
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
      
      if (accepted) {
        // Find the invitation that was accepted to get the project ID
        const invitation = receivedInvitations.find(inv => inv.invitationId === invitationId);
        if (invitation) {
          // Navigate to the project page with the correct path
          navigate(`/projects/${invitation.projectId}`);
          return; // Return early since we're navigating away
        }
      }
      
      // Only update the invitations list if we're not navigating away
      setReceivedInvitations(receivedInvitations.filter(inv => inv.invitationId !== invitationId));
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setError('Failed to respond to invitation');
    } finally {
      setRespondingTo(null);
    }
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

  if (sentInvitations.length === 0 && receivedInvitations.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No pending invitations</p>
    );
  }

  return (
    <div className="space-y-6">
      {receivedInvitations.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Received Invitations</h3>
          <div className="space-y-3">
            {receivedInvitations.map((invitation) => (
              <div 
                key={invitation.invitationId}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      Project: {invitation.projectTitle}
                    </p>
                    <p className="text-sm text-gray-600">
                      From: {invitation.senderName} ({invitation.senderInstitution})
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {invitation.sentAt?.toDate().toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Project Description:</p>
                    <p className="bg-white p-3 rounded border border-gray-200">
                      {invitation.projectDescription}
                    </p>
                  </div>

                  {invitation.projectMilestones?.length > 0 && (
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Project Milestones:</p>
                      <ul className="bg-white p-3 rounded border border-gray-200 space-y-1">
                        {invitation.projectMilestones.map((milestone, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{milestone.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleResponse(invitation.invitationId, true, invitation.projectId)}
                    disabled={respondingTo === invitation.invitationId}
                    className="px-4 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleResponse(invitation.invitationId, false)}
                    disabled={respondingTo === invitation.invitationId}
                    className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sentInvitations.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Sent Invitations</h3>
          <div className="space-y-3">
            {sentInvitations.map((invitation) => (
              <div 
                key={invitation.invitationId}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      Project: {invitation.projectTitle}
                    </p>
                    <p className="text-sm text-gray-600">
                      To: {invitation.researcherName} ({invitation.researcherInstitution})
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {invitation.sentAt?.toDate().toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending Response
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}