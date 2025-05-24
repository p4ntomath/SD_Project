import { FiHome, FiUsers, FiFolder, FiDollarSign, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { useState } from 'react';
import { logOut } from '../../../backend/firebase/authFirebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminMainNav({ setMobileMenuOpen, mobileMenuOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setShowLogoutModal(false);
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="flex justify-between h-16 items-center">
            <section className="hidden md:flex items-center space-x-2">
              <button 
                onClick={() => navigate('/admin')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Dashboard"
              >
                <FiHome className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Dashboard</p>
              </button>

              <button 
                onClick={() => navigate('/admin/users')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/users' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Users"
              >
                <FiUsers className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Users</p>
              </button>

              <button 
                onClick={() => navigate('/admin/projects')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/projects' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Projects"
              >
                <FiFolder className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Projects</p>
              </button>

              <button 
                onClick={() => navigate('/admin/funding')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/funding' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Funding"
              >
                <FiDollarSign className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Funding</p>
              </button>
            </section>

            <section className='hidden md:flex items-center space-x-6'>
              <section className="hidden md:flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">Admin Portal</h1>
              </section>

              <section className="hidden md:flex items-center">
                <button
                  className="bg-gray-500 hover:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center"
                  aria-label="Logout"
                  onClick={() => setShowLogoutModal(true)}
                >
                  Logout
                </button>
              </section>
            </section>

            {/*Mobile*/}
            <section className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </section>
          </section>
        </section>

        {mobileMenuOpen && (
          <section className="md:hidden bg-white shadow-md">
            <section className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Logout
              </button>
            </section>
          </section>
        )}
      </nav>
      

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <motion.div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <motion.article
                className="relative inline-block align-bottom bg-white/90 backdrop-blur-md rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200"
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ 
                  duration: 0.15,
                  ease: "easeOut"
                }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Confirm Logout
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to log out? You'll need to sign in again to access your account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
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
                </div>
              </motion.article>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}