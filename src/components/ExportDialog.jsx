import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { auth } from '../backend/firebase/firebaseConfig';
import { fetchProjects } from '../backend/firebase/projectDB';

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  onExport, 
  type,
  format,
  loading 
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const user = auth.currentUser;
        if (!user) return;
        
        const fetchedProjects = await fetchProjects(user.uid);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const handleExport = () => {
    onExport(type, format, {
      startDate: startDate || null,
      endDate: endDate || null,
      projectIds: selectedProjects.length > 0 ? selectedProjects : null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Export {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Projects (Optional)
              </label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {loadingProjects ? (
                  <div className="text-center py-2 text-gray-500">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-2 text-gray-500">No projects found</div>
                ) : (
                  projects.map(project => (
                    <label key={project.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{project.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-blue-700/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <ClipLoader size={16} color="#FFFFFF" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  'Export'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}