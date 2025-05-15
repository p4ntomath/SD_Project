import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { searchResearchers } from '../../backend/firebase/collaborationDB';
import { auth } from '../../backend/firebase/firebaseConfig';

export default function AssignCollaboratorsModal({ isOpen, onClose, onAssign, projectId, project }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResearchers, setSelectedResearchers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({});

  useEffect(() => {
    const searchForResearchers = async () => {
      try {
        setSearchLoading(true);
        const researchers = await searchResearchers(searchTerm, auth.currentUser?.uid, project);
        setSearchResults(researchers || []);
      } catch (error) {
        console.error('Error searching for researchers:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(searchForResearchers, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, projectId, project]);

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

  const handleRoleChange = (researcherId, role) => {
    setSelectedRoles(prev => ({
      ...prev,
      [researcherId]: role
    }));
  };

  const handleAssign = () => {
    const researchersWithRoles = selectedResearchers.map(researcher => ({
      ...researcher,
      role: selectedRoles[researcher.id]
    }));
    onAssign(researchersWithRoles);
    setSelectedResearchers([]);
    setSelectedRoles({});
    setSearchTerm('');
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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Project Collaborators</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Researchers</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or institution..."
              />
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {searchLoading ? (
                <div className="flex justify-center items-center py-8">
                  <ClipLoader size={20} color="#3B82F6" />
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {searchResults.map((researcher) => (
                    <li 
                      key={researcher.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={selectedResearchers.some(r => r.id === researcher.id)}
                          onChange={() => handleToggleResearcher(researcher)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{researcher.fullName}</p>
                          <p className="text-xs text-gray-500">{researcher.institution || 'No institution specified'}</p>
                        </div>
                        {selectedResearchers.some(r => r.id === researcher.id) && (
                          <select
                            value={selectedRoles[researcher.id] || 'Collaborator'}
                            onChange={(e) => handleRoleChange(researcher.id, e.target.value)}
                            className="ml-4 text-sm bg-white border border-gray-300 rounded-md px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Collaborator">Collaborator</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : searchTerm ? (
                <p className="text-gray-500 text-center py-8">No researchers found</p>
              ) : (
                <p className="text-gray-500 text-center py-8">Start typing to search for researchers</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedResearchers.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add Selected
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}