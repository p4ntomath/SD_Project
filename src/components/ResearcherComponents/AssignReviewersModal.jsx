import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAvailableReviewers } from '../../backend/firebase/reviewerDB';

export default function AssignReviewersModal({ isOpen, onClose, onAssign, projectId, reviewRequests }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingReviewers, setFetchingReviewers] = useState(true);
  const [allReviewers, setAllReviewers] = useState([]);

  useEffect(() => {
    const loadReviewers = async () => {
      try {
        const reviewers = await getAvailableReviewers();
        
        // Filter out both active reviewers and those with pending/accepted requests
        const unavailableReviewerIds = [
          ...reviewRequests
            .filter(req => req.status === 'pending' || req.status === 'accepted')
            .map(req => req.reviewerId),
          ...reviewRequests
            .filter(req => req.status === 'completed')
            .map(req => req.reviewerId)
        ];

        const filteredReviewers = reviewers.filter(reviewer => 
          !unavailableReviewerIds.includes(reviewer.id)
        );

        const formattedReviewers = filteredReviewers.map(reviewer => ({
          id: reviewer.id,
          name: reviewer.fullName,
          fieldOfResearch: reviewer.fieldOfResearch || 'Not specified',
          department: reviewer.department || 'Not specified'
        }));
        
        setAllReviewers(formattedReviewers);
        setAvailableReviewers(formattedReviewers);
      } catch (error) {
        console.error('Error fetching reviewers:', error);
      } finally {
        setFetchingReviewers(false);
      }
    };

    if (isOpen) {
      loadReviewers();
    }
  }, [isOpen, reviewRequests]);

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal closes
      setSelectedReviewers([]);
      setSearchQuery('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setAvailableReviewers(allReviewers);
    } else {
      const filtered = allReviewers.filter(reviewer =>
        reviewer.name.toLowerCase().includes(query.toLowerCase()) ||
        reviewer.fieldOfResearch.toLowerCase().includes(query.toLowerCase()) ||
        reviewer.department.toLowerCase().includes(query.toLowerCase())
      );
      setAvailableReviewers(filtered);
    }
  };

  const handleSelectReviewer = (reviewer) => {
    if (selectedReviewers.find(r => r.id === reviewer.id)) {
      setSelectedReviewers(selectedReviewers.filter(r => r.id !== reviewer.id));
    } else {
      setSelectedReviewers([...selectedReviewers, reviewer]);
    }
  };

  const handleAssign = async () => {
    if (selectedReviewers.length === 0) return;
    setLoading(true);
    try {
      await onAssign(selectedReviewers);
    } catch (error) {
      console.error('Error assigning reviewers:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
        >
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span>Sending reviewer requests...</span>
                  </div>
                ) : (
                  'Assign Reviewers'
                )}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search reviewers by name, field Of Research, or department..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {fetchingReviewers ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
                <p className="text-sm text-gray-500">Loading reviewers...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {availableReviewers.map((reviewer) => (
                <div
                  key={reviewer.id}
                  onClick={() => handleSelectReviewer(reviewer)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedReviewers.find(r => r.id === reviewer.id)
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{reviewer.name}</h3>
                      <p className="text-sm text-gray-500">
                        {reviewer.fieldOfResearch} • {reviewer.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedReviewers.find(r => r.id === reviewer.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedReviewers.find(r => r.id === reviewer.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {availableReviewers.length === 0 && !fetchingReviewers && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviewers found</p>
                </div>
              )}
            </div>
          )}

          <footer className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {selectedReviewers.length} reviewer{selectedReviewers.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedReviewers.length === 0 || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Sending requests...</span>
                  </div>
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}