import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logOut } from '../backend/firebase/authFirebase';
import { useNavigate } from 'react-router-dom';
import { createFunding, getAllFunding, fetchProjectsWithUsers, fetchAllUsers } from '../backend/firebase/adminAccess.jsx';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { ClipLoader } from 'react-spinners';

export default function AdminHomePage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    fundingOpportunities: 0,
    totalDocuments: 0
  });
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showAddFunding, setShowAddFunding] = useState(false);
  const [newFunding, setNewFunding] = useState({
    name: '',
    expectedFunds: '',
    externalLink: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users using adminAccess method
        const users = await fetchAllUsers();
        const totalUsers = users.length;

        // Fetch active projects with user data using adminAccess method
        const projectsList = await fetchProjectsWithUsers();
        const activeProjects = projectsList.length;

        // Fetch funding opportunities using adminAccess method
        const fundingOpps = await getAllFunding();
        const fundingCount = fundingOpps.length;

        // Fetch total documents
        const documents = await fetchAllDocuments();
        const totalDocuments = documents.length;

        setProjects(projectsList);

        setStats({
          totalUsers,
          activeProjects,
          fundingOpportunities: fundingCount,
          totalDocuments
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddFunding = async (e) => {
    e.preventDefault();
    try {
      await createFunding(newFunding);
      setNewFunding({ name: '', expectedFunds: '', externalLink: '' });
      setShowAddFunding(false);
      
      // Refresh stats to show new funding count
      const fundingOpps = await getAllFunding();
      setStats(prev => ({
        ...prev,
        fundingOpportunities: fundingOpps.length
      }));
    } catch (error) {
      console.error('Error adding funding opportunity:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Updated header to be side by side on all screen sizes */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            aria-label="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7 4a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            // Loading skeletons for stats
            <>
              {[...Array(4)].map((_, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-16 bg-gray-300 rounded animate-pulse" />
                </motion.div>
              ))}
            </>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/admin/users')}
                data-testid="total-users-card"
              >
                <h3 className="text-gray-500 text-sm">Total Users</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/admin/projects')}
                data-testid="active-projects-card"
              >
                <h3 className="text-gray-500 text-sm">Projects Active</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
                onClick={() => {
                  setShowAddFunding(true);
                }}
                data-testid="funding-opportunities-card"
              >
                <h3 className="text-gray-500 text-sm">Funding Opportunities</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.fundingOpportunities}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/admin/documents')}
                data-testid="total-documents-card"
              >
                <h3 className="text-gray-500 text-sm">Total Documents</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </motion.div>
            </>
          )}
        </div>

        {/* Project Oversight */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Project Oversight</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="min-h-[200px] flex items-center justify-center">
                <ClipLoader color="#3B82F6" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Research Field</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.userFullName}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {project.status || 'In Progress'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {project.researchField || 'Not specified'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/admin/projects/${project.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && projects.length > 5 && (
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => navigate('/admin/projects')}
                  className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                >
                  View all projects
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Announcements Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Announcements</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
            <p>Create and manage announcements here. Feature coming soon.</p>
          </div>
        </motion.div>

        {/* Add Funding Modal */}
        {showAddFunding && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <form onSubmit={handleAddFunding} className="px-4 pt-5 pb-4 sm:p-6">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                      Funding Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={newFunding.name}
                      onChange={(e) => setNewFunding(prev => ({ ...prev, name: e.target.value }))}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="expectedFunds" className="block text-gray-700 text-sm font-bold mb-2">
                      Expected Funds (R)
                    </label>
                    <input
                      type="number"
                      id="expectedFunds"
                      value={newFunding.expectedFunds}
                      onChange={(e) => setNewFunding(prev => ({ ...prev, expectedFunds: e.target.value }))}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="externalLink" className="block text-gray-700 text-sm font-bold mb-2">
                      External Link
                    </label>
                    <input
                      type="url"
                      id="externalLink"
                      value={newFunding.externalLink}
                      onChange={(e) => setNewFunding(prev => ({ ...prev, externalLink: e.target.value }))}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Add Funding
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddFunding(false)}
                      className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}