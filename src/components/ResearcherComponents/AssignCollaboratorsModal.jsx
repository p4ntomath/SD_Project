import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { searchResearchers, getAllResearchers } from '../../backend/firebase/collaborationDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import { notify } from '../../backend/firebase/notificationsUtil';
import { getUserById } from '../../backend/firebase/notificationsUtil';
import { useDebounce } from '../../hooks/useDebounce';

// Modal for assigning collaborators to a project
export default function AssignCollaboratorsModal({ isOpen, onClose, onAssign, projectId, project }) {
  // State for search input, results, selected researchers, loading, and roles
  const [searchTerm, setSearchTerm] = useState('');
  const [allResearchers, setAllResearchers] = useState([]);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [selectedResearchers, setSelectedResearchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingResearchers, setFetchingResearchers] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const PAGE_SIZE = 10;

  // Load initial researchers when modal opens
  useEffect(() => {
    const loadInitialResearchers = async () => {
      if (!isOpen) return;
      
      try {
        setFetchingResearchers(true);
        const result = await getAllResearchers(auth.currentUser?.uid, project, PAGE_SIZE);
        setAllResearchers(result.researchers);
        setFilteredResearchers(result.researchers);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Error loading researchers:', error);
      } finally {
        setFetchingResearchers(false);
      }
    };

    loadInitialResearchers();
  }, [isOpen, project]);

  // Handle debounced search
  useEffect(() => {
    const handleSearch = async () => {
      const searchQuery = debouncedSearchTerm.trim().toLowerCase();
      if (!searchQuery) {
        setFilteredResearchers(allResearchers);
        return;
      }

      const filtered = allResearchers.filter(researcher => {
        const fullName = (researcher.fullName || '').toLowerCase();
        const institution = (researcher.institution || '').toLowerCase();
        const fieldOfResearch = (researcher.fieldOfResearch || '').toLowerCase();

        // Check if any part of the researcher's name matches
        const nameMatch = fullName.split(' ').some(part => part.startsWith(searchQuery));
        
        return nameMatch || 
               institution.includes(searchQuery) || 
               fieldOfResearch.includes(searchQuery);
      });
      
      setFilteredResearchers(filtered);
    };

    handleSearch();
  }, [debouncedSearchTerm, allResearchers]);

  // Load more researchers
  const loadMore = async () => {
    if (!hasMore || loadingMore || debouncedSearchTerm) return;
    
    try {
      setLoadingMore(true);
      const result = await getAllResearchers(auth.currentUser?.uid, project, PAGE_SIZE, lastDoc);
      setAllResearchers(prev => [...prev, ...result.researchers]);
      setFilteredResearchers(prev => [...prev, ...result.researchers]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more researchers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedResearchers([]);
      setSelectedRoles({});
      setLastDoc(null);
      setHasMore(true);
    }
  }, [isOpen]);

  // Handle intersection observer for infinite scrolling
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMore();
    }
  };

  // Toggle researcher selection and manage their role
  const handleToggleResearcher = (researcher) => {
    setSelectedResearchers(prev => {
      const isSelected = prev.some(r => r.id === researcher.id);
      if (isSelected) {
        setSelectedRoles(prevRoles => {
          const { [researcher.id]: _, ...rest } = prevRoles;
          return rest;
        });
        return prev.filter(r => r.id !== researcher.id);
      } else {
        setSelectedRoles(prevRoles => ({
          ...prevRoles,
          [researcher.id]: 'Collaborator' // Default role
        }));
        return [...prev, researcher];
      }
    });
  };

  // Change the role for a selected researcher
  const handleRoleChange = (researcherId, role) => {
    setSelectedRoles(prev => ({
      ...prev,
      [researcherId]: role
    }));
  };

  // Assign selected researchers and send notifications
  const handleAssign = async () => {
    if (!selectedResearchers.length) return;
    setLoading(true);

    try {
      // Prepare researchers with their assigned roles
      const researchersWithRoles = selectedResearchers.map(researcher => ({
        ...researcher,
        role: selectedRoles[researcher.id]
      }));

      await onAssign(researchersWithRoles);

      // Reset state
      setSelectedResearchers([]);
      setSelectedRoles({});
      setSearchTerm('');

      // Get sender's name for notifications
      const senderUser = await getUserById(auth.currentUser.uid);
      const senderName = senderUser?.fullName || "A researcher";

      // Notify each recipient
      await Promise.all(selectedResearchers.map(researcher =>
        notify({
          type: 'Collaboration Request Received',
          projectId,
          projectTitle: project.title,
          researcherName: senderName,
          targetUserId: researcher.id,
          senderUserId: auth.currentUser.uid,
          message: `You have received a collaboration request from ${senderName} for project "${project.title || 'Untitled Project'}".`
        })
      ));

      // Notify sender
      await notify({
        type: 'Collaboration Request Sent',
        projectId,
        projectTitle: project.title,
        researcherName: selectedResearchers.map(r => r.fullName).join(', '),
        targetUserId: auth.currentUser.uid,
        senderUserId: auth.currentUser.uid,
      });

    } catch (error) {
      console.error('Error assigning collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <section className="fixed inset-0 z-50 overflow-y-auto">
      <section className="flex min-h-screen items-center justify-center p-4">
        {/* Modal background overlay */}
        <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <motion.section
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
        >
          {/* Modal header */}
          <header className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span>Adding collaborators...</span>
                </span>
              ) : (
                'Add Project Collaborators'
              )}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
              disabled={loading}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* Search input */}
          <section className="mb-4">
            <section className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter researchers by name, field of research, or institution..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                aria-label="Search researchers"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </section>
          </section>

          {/* Researchers list */}
          <section 
            className="max-h-[400px] overflow-y-auto"
            onScroll={handleScroll}
          >
            {fetchingResearchers ? (
              <section className="flex items-center justify-center py-12">
                <section className="flex flex-col items-center gap-3">
                  <span className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
                  <p className="text-sm text-gray-500">Loading researchers...</p>
                </section>
              </section>
            ) : (
              <section className="space-y-2">
                {filteredResearchers.map((researcher) => (
                  <article
                    key={researcher.id}
                    onClick={() => !loading && handleToggleResearcher(researcher)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResearchers.some(r => r.id === researcher.id)
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <section className="flex items-center gap-3 flex-1">
                      <section className="p-2 bg-blue-100 rounded-full">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </section>
                      <section>
                        <h3 className="font-medium text-gray-900">{researcher.fullName}</h3>
                        <p className="text-sm text-gray-500">
                          {researcher.institution || 'No institution specified'}
                          {researcher.fieldOfResearch && ` • ${researcher.fieldOfResearch}`}
                        </p>
                      </section>
                    </section>

                    {selectedResearchers.some(r => r.id === researcher.id) && (
                      <section className="flex items-center">
                        <select
                          value={selectedRoles[researcher.id] || 'Collaborator'}
                          onChange={(e) => handleRoleChange(researcher.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm bg-white border border-gray-300 rounded-md px-2 py-1"
                          disabled={loading}
                        >
                          <option value="Collaborator">Collaborator</option>
                          <option value="Editor">Editor</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </section>
                    )}
                  </article>
                ))}

                {loadingMore && (
                  <section className="flex justify-center py-4">
                    <ClipLoader size={20} color="#3B82F6" />
                  </section>
                )}

                {filteredResearchers.length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No researchers found matching your search' : 'No available researchers found'}
                  </p>
                )}
              </section>
            )}
          </section>

          {/* Modal footer */}
          <footer className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {selectedResearchers.length} researcher{selectedResearchers.length !== 1 ? 's' : ''} selected
            </p>
            <section className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedResearchers.length === 0 || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Adding...</span>
                  </span>
                ) : (
                  'Add Selected'
                )}
              </button>
            </section>
          </footer>
        </motion.section>
      </section>
    </section>
  );
}