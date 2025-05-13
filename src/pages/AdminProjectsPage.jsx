import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchProjectsWithUsers } from '../backend/firebase/adminAccess.jsx';
import { ClipLoader } from 'react-spinners';
import MainNav from '../components/AdminComponents/Navigation/AdminMainNav';
import MobileBottomNav from '../components/AdminComponents/Navigation/AdminMobileBottomNav';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Get unique creators for filter dropdown
  const uniqueCreators = [...new Set(projects.map(project => project.userFullName))];

  // Filter projects based on selected creator
  const filteredProjects = selectedCreator === 'all' 
    ? projects 
    : projects.filter(project => project.userFullName === selectedCreator);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjectsWithUsers();
        setProjects(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Back to dashboard"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Project Management</h1>
            </div>

            <div className="flex items-center w-full sm:w-auto">
              <label htmlFor="creator-filter" className="mr-2 text-sm text-gray-600 whitespace-nowrap">
                Filter by Creator:
              </label>
              <select
                id="creator-filter"
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Creators</option>
                {uniqueCreators.map(creator => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {loading ? (
              <div className="min-h-[200px] flex items-center justify-center">
                <ClipLoader color="#3B82F6" aria-label="loading" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Research Field</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 break-words">{project.title}</div>
                          <div className="text-sm text-gray-500 sm:hidden mt-1">
                            Status: {project.status || 'In Progress'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm text-gray-900">{project.userFullName}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {project.status || 'In Progress'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-900">{project.researchField || 'Not specified'}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProjects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No projects found</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </div>
  );
}