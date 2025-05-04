import { FiHome, FiList, FiUser, FiMenu, FiX, FiSearch, FiClock, FiInbox } from 'react-icons/fi';
import { useState } from 'react';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { logOut } from '../../../backend/firebase/authFirebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function ReviewerMainNav({ setMobileMenuOpen, mobileMenuOpen, onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
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
                onClick={() => navigate('/reviewer/dashboard')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/dashboard' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Home"
              >
                <FiHome className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
              </button>

              <button 
                onClick={() => navigate('/reviewer/requests')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/requests' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Pending Review Requests"
              >
                <FiInbox className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Requests</p>
              </button>

              <button 
                onClick={() => navigate('/reviewer/assigned')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/assigned' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Approved Projects"
              >
                <ClipboardDocumentCheckIcon className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Approved</p>
              </button>

              <button 
                onClick={() => navigate('/reviewer/history')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/history' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Review History"
              >
                <FiClock className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">History</p>
              </button>

              <button 
                onClick={() => navigate('/reviewer/account')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/account' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="View profile"
              >
                <FiUser className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Account</p>
              </button>
            </section>
            
            <section className="flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative">
                <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </section>
                <input
                  type="text"
                  placeholder="Search reviews..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </section>

            <section className='hidden md:flex items-center space-x-6'>
              <section className="hidden md:flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">Review Portal</h1>
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
                onClick={() => navigate('/reviewer/account')}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                aria-label="View profile"
              >
                My Profile
              </button>
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
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <motion.article
                className="relative inline-block align-bottom bg-white/90 backdrop-blur-md rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
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