import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAvailableReviewers } from '../../backend/firebase/reviewerDB';
import { notify } from '../../backend/firebase/notificationsUtil';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../backend/firebase/firebaseConfig';

export default function AssignReviewersModal({ isOpen, onClose, onAssign, projectId, projectTitle, reviewRequests }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingReviewers, setFetchingReviewers] = useState(true);
  const [allReviewers, setAllReviewers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const loadReviewers = async () => {
        try {
          setFetchingReviewers(true);
          const reviewers = await getAvailableReviewers();
          
          // Filter out reviewers who already have pending requests
          const filteredReviewers = reviewers.filter(reviewer => 
            !reviewRequests?.some(request => 
              request.reviewerId === reviewer.id && 
              (request.status === 'pending' || request.status === 'accepted')
            )
          );
          
          setAllReviewers(filteredReviewers);
          setAvailableReviewers(filteredReviewers);
        } catch (err) {
          console.error('Error loading reviewers:', err);
        } finally {
          setFetchingReviewers(false);
        }
      };

      loadReviewers();
      setSelectedReviewers([]);
      setSearchQuery('');
    }
  }, [isOpen, reviewRequests]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setAvailableReviewers(allReviewers);
      return;
    }

    const filtered = allReviewers.filter(reviewer =>
      reviewer.name.toLowerCase().includes(query.toLowerCase()) ||
      reviewer.fieldOfResearch?.toLowerCase().includes(query.toLowerCase())
    );
    setAvailableReviewers(filtered);
  };

  const handleSelectReviewer = (reviewer) => {
    if (selectedReviewers.some(r => r.id === reviewer.id)) {
      setSelectedReviewers(selectedReviewers.filter(r => r.id !== reviewer.id));
    } else {
      setSelectedReviewers([...selectedReviewers, reviewer]);
    }
  };

  const handleAssign = async () => {
    try {
      setLoading(true);
      await onAssign(selectedReviewers);
      
      // Send notifications to selected reviewers
      const currentUser = auth.currentUser;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userName = userDoc.data()?.name || 'Unknown User';

      for (const reviewer of selectedReviewers) {
        notify({
          type: 'Review Request',
          projectId,
          projectTitle,
          reviewerId: reviewer.id,
          senderName: userName
        });
      }
      
      onClose();
    } catch (err) {
      console.error('Error assigning reviewers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Assign Reviewers</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search reviewers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {fetchingReviewers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {availableReviewers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No reviewers available</p>
              ) : (
                <ul className="space-y-2">
                  {availableReviewers.map((reviewer) => (
                    <li
                      key={reviewer.id}
                      onClick={() => handleSelectReviewer(reviewer)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedReviewers.some(r => r.id === reviewer.id)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{reviewer.name}</h3>
                          <p className="text-sm text-gray-500">{reviewer.fieldOfResearch || 'No field of research specified'}</p>
                        </div>
                        {selectedReviewers.some(r => r.id === reviewer.id) && (
                          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={selectedReviewers.length === 0 || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign Selected'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}