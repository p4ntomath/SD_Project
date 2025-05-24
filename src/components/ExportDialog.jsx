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
    <dialog open={isOpen} className="fixed inset-0 z-50 overflow-y-auto bg-transparent" aria-labelledby="dialog-title">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <motion.article
          role="dialog"
          aria-modal="true"
          className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <header>
            <h2 id="dialog-title" className="text-xl font-semibold mb-4 text-gray-900">
              Export {type.charAt(0).toUpperCase() + type.slice(1)} Report
            </h2>
          </header>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Date Range (Optional)
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500" htmlFor="start-date">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500" htmlFor="end-date">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Projects (Optional)
              </legend>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {loadingProjects ? (
                  <p className="text-center py-2 text-gray-500">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="text-center py-2 text-gray-500">No projects found</p>
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
            </fieldset>

            <footer className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
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
            </footer>
          </form>
        </motion.article>
      </div>
    </dialog>
  );
}