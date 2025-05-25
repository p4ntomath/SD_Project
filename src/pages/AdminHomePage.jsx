import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logOut } from '../backend/firebase/authFirebase';
import { useNavigate } from 'react-router-dom';
import { createFunding, getAllFunding, fetchProjectsWithUsers, fetchAllUsers } from '../backend/firebase/adminAccess.jsx';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { ClipLoader } from 'react-spinners';
import { getAuth } from 'firebase/auth'; // Add this import if using Firebase Auth
import MainNav from '../components/AdminComponents/Navigation/AdminMainNav';
import MobileBottomNav from '../components/AdminComponents/Navigation/AdminMobileBottomNav';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [showAddFunding, setShowAddFunding] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
    setShowLogoutModal(false);
  };

  const handleAddFunding = async (e) => {
  e.preventDefault();
  try {
    await createFunding(newFunding);
    setNewFunding({ name: '', expectedFunds: '', externalLink: '' });
    setShowAddFunding(false);

    // Get current admin user ID
    const auth = getAuth();
    const adminId = auth.currentUser?.uid;

    // Fetch all users
    const users = await fetchAllUsers();

    // Get all researcher userIds
    const researcherIds = users
      .filter(user => user.role === 'researcher')
      .map(user => user.id);

    // Send notification to each researcher
    await Promise.all(
      researcherIds.map(userId =>
        notify({
          type: 'Funding Opportunity Added',
          FundingName: newFunding.name,
          targetUserId: userId,
          senderUserId: adminId
        })
      )
    );
    

    // Send notification to admin (self)
    if (adminId) {
      await notify({
        type: 'Funding Opportunity Added',
        FundingName: newFunding.name,
        targetUserId: adminId,
        senderUserId: adminId
      });
    }
    Console.log('Notifications sent to researchers and admin');
    // Refresh stats to show new funding count
    const fundingOpps = await getAllFunding();
    setStats(prev => ({
      ...prev,
      fundingOpportunities: fundingOpps.length
    }));
  } catch (error) {
      Console.log('Notifications not sent to researchers and admin');
  
  
  }
};

  return (
    <section className="min-h-screen bg-gray-50">
      <header>
        <MainNav 
          setMobileMenuOpen={setMobileMenuOpen} 
          mobileMenuOpen={mobileMenuOpen}
          setShowLogoutModal={setShowLogoutModal}
        />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8" data-testid="admin-dashboard">
        <section className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <section className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              // Loading skeletons for stats
              <>
                {[...Array(4)].map((_, index) => (
                  <motion.section 
                    key={index}
                    data-testid="loading-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <section className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                    <section className="h-8 w-16 bg-gray-300 rounded animate-pulse" />
                  </motion.section>
                ))}
              </>
            ) : (
              <>
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/users')}
                  data-testid="total-users-card"
                >
                  <h3 className="text-gray-500 text-sm">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </motion.section>

                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/projects')}
                  data-testid="active-projects-card"
                >
                  <h3 className="text-gray-500 text-sm">Projects Active</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                </motion.section>

                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
                  onClick={() => {
                    navigate('/admin/funding');
                  }}
                  data-testid="funding-opportunities-card"
                >
                  <h3 className="text-gray-500 text-sm">Funding Opportunities</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.fundingOpportunities}</p>
                </motion.section>

                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate('/admin/documents')}
                  data-testid="total-documents-card"
                >
                  <h3 className="text-gray-500 text-sm">Total Documents</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                </motion.section>
              </>
            )}
          </section>

          {/* Project Oversight */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <section className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Project Oversight</h2>
            </section>
            <section className="overflow-x-auto">
              {loading ? (
                <section className="min-h-[200px] flex items-center justify-center">
                  <ClipLoader color="#3B82F6" />
                </section>
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
                          <section className="text-sm font-medium text-gray-900">{project.title}</section>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <section className="text-sm text-gray-900">{project.userFullName}</section>
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
                <section className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/admin/projects')}
                    className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                  >
                    View all projects
                  </button>
                </section>
              )}
            </section>
          </motion.section>

          {/* Announcements Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Announcements</h2>
            <section className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p>Create and manage announcements here. Feature coming soon.</p>
            </section>
          </motion.section>

          {/* Add Funding Modal */}
          {showAddFunding && (
            <section className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <section className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <section className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></section>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <section className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                  <form onSubmit={handleAddFunding} className="px-4 pt-5 pb-4 sm:p-6">
                    <section className="mb-4">
                      <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                        Funding Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={newFunding.funding_name}
                        onChange={(e) => setNewFunding(prev => ({ ...prev, name: e.target.value }))}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </section>
                    <section className="mb-4">
                      <label htmlFor="expectedFunds" className="block text-gray-700 text-sm font-bold mb-2">
                        Expected Funds (R)
                      </label>
                      <input
                        type="number"
                        id="expectedFunds"
                        value={newFunding.expected_funds}
                        onChange={(e) => setNewFunding(prev => ({ ...prev, expectedFunds: e.target.value }))}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </section>
                    <section className="mb-4">
                      <label htmlFor="externalLink" className="block text-gray-700 text-sm font-bold mb-2">
                        External Link
                      </label>
                      <input
                        type="url"
                        id="externalLink"
                        value={newFunding.external_link}
                        onChange={(e) => setNewFunding(prev => ({ ...prev, externalLink: e.target.value }))}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </section>
                    <section className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
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
                    </section>
                  </form>
                </section>
              </section>
            </section>
          )}

          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutModal && (
              <section className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <section className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <section className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true"></section>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  <motion.article
                    className="relative inline-block align-bottom bg-white/90 backdrop-blur-md rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                  >
                    <section className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <section className="sm:flex sm:items-start">
                        <section className="mt-3 text-center sm:mt-0 sm:text-left">
                          <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Confirm Logout
                          </h3>
                          <section className="mt-2">
                            <p className="text-sm text-gray-500">
                              Are you sure you want to log out? You'll need to sign in again to access your account.
                            </p>
                          </section>
                        </section>
                      </section>
                    </section>
                    <section className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        data-testid="confirm-logout"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => setShowLogoutModal(false)}
                      >
                        Cancel
                      </button>
                    </section>
                  </motion.article>
                </section>
              </section>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </section>
  );
}