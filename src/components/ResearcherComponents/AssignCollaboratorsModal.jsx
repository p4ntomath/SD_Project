import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { searchResearchers } from '../../backend/firebase/collaborationDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import { notify } from '../../backend/firebase/notificationsUtil';
import { getUserById } from '../../backend/firebase/notificationsUtil';

// Modal for assigning collaborators to a project
export default function AssignCollaboratorsModal({ isOpen, onClose, onAssign, projectId, project }) {
  // State for search input, results, selected researchers, loading, and roles
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResearchers, setSelectedResearchers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loading, setLoading] = useState(false); // Loading state for assignment

  // Effect: Search for researchers as user types (debounced)
  useEffect(() => {
    const searchForResearchers = async () => {
      try {
        setSearchLoading(true);
        // Search researchers, excluding current user and already assigned
        const researchers = await searchResearchers(searchTerm, auth.currentUser?.uid, project);
        setSearchResults(researchers || []);
      } catch (error) {
        console.error('Error searching for researchers:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce search to avoid excessive requests
    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(searchForResearchers, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, projectId, project]);

  // Toggle researcher selection and manage their role
  const handleToggleResearcher = (researcher) => {
    setSelectedResearchers(prev => {
      const isSelected = prev.some(r => r.id === researcher.id);
      if (isSelected) {
        // Remove researcher and their role if already selected
        setSelectedRoles(prevRoles => {
          const { [researcher.id]: _, ...rest } = prevRoles;
          return rest;
        });
        return prev.filter(r => r.id !== researcher.id);
      } else {
        // Add researcher with default role
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

  // Assign selected researchers to the project and send notifications
  const handleAssign = async () => {
    setLoading(true);
    try {
      // Prepare researchers with their assigned roles
      const researchersWithRoles = selectedResearchers.map(researcher => ({
        ...researcher,
        role: selectedRoles[researcher.id]
      }));
      await onAssign(researchersWithRoles);
      setSelectedResearchers([]);
      setSelectedRoles({});
      setSearchTerm('');

      // Get sender's name for notifications
      const senderUser = await getUserById(auth.currentUser.uid);
      const senderName = senderUser?.fullName || "A researcher";

      // Notify sender (current user)
      await notify({
        type: 'Collaboration Request Sent',
        projectId,
        projectTitle: project.title,
        researcherName: selectedResearchers.map(r => r.fullName).join(', '),
        targetUserId: auth.currentUser.uid,
        senderUserId: auth.currentUser.uid,
        message: `You sent a collaboration request to ${selectedResearchers.map(r => r.fullName).join(', ')} for project "${project.title || 'Untitled Project'}".`
      });

      // Notify each recipient with correct sender name
      await Promise.all(selectedResearchers.map(researcher =>
        notify({
          type: 'Collaboration Request Received',
          projectId,
          projectTitle: project.title,
          researcherName: senderName, // Use sender's name here
          targetUserId: researcher.id,
          senderUserId: auth.currentUser.uid,
          message: `You have received a collaboration request from ${senderName} for project "${project.title || 'Untitled Project'}".`
        })
      ));

    } catch (error) {
      console.error('Error assigning collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render modal if not open
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
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Project Collaborators</h2>
          <section className="space-y-4">
            {/* Search input */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Researchers</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or institution..."
                disabled={loading}
              />
            </section>

            {/* Search results list */}
            <section className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {searchLoading ? (
                // Show loading spinner while searching
                <section className="flex justify-center items-center py-8">
                  <ClipLoader size={20} color="#3B82F6" />
                </section>
              ) : searchResults.length > 0 ? (
                // List of researchers found
                <ul className="sectionide-y sectionide-gray-200">
                  {searchResults.map((researcher) => (
                    <li 
                      key={researcher.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <section className="flex items-center flex-1">
                        {/* Checkbox to select researcher */}
                        <input
                          type="checkbox"
                          checked={selectedResearchers.some(r => r.id === researcher.id)}
                          onChange={() => handleToggleResearcher(researcher)}
                          className="h-4 w-4 text-blue-600 rounded"
                          disabled={loading}
                        />
                        <section className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{researcher.fullName}</p>
                          <p className="text-xs text-gray-500">{researcher.institution || 'No institution specified'}</p>
                        </section>
                        {/* Role selector for selected researcher */}
                        {selectedResearchers.some(r => r.id === researcher.id) && (
                          <select
                            value={selectedRoles[researcher.id] || 'Collaborator'}
                            onChange={(e) => handleRoleChange(researcher.id, e.target.value)}
                            className="ml-4 text-sm bg-white border border-gray-300 rounded-md px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                            disabled={loading}
                          >
                            <option value="Collaborator">Collaborator</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        )}
                      </section>
                    </li>
                  ))}
                </ul>
              ) : searchTerm ? (
                // No researchers found
                <p className="text-gray-500 text-center py-8">No researchers found</p>
              ) : (
                // Prompt to start searching
                <p className="text-gray-500 text-center py-8">Start typing to search for researchers</p>
              )}
            </section>

            {/* Modal action buttons */}
            <section className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
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
                  <>
                    {/* Loading spinner while assigning */}
                    <section className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <p>Adding...</p>
                  </>
                ) : (
                  'Add Selected'
                )}
              </button>
            </section>
          </section>
        </motion.section>
      </section>
    </section>
  );
}