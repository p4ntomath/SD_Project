import { FiHome, FiList, FiUser, FiMenu, FiX, FiSearch, FiClock, FiInbox, FiMessageSquare } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { logOut } from '../../../backend/firebase/authFirebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useUnreadNotificationsCount, useUnreadMessagesCount } from '../../../backend/firebase/notificationsUtil';
import { FiBell } from 'react-icons/fi';
import { searchUsers } from '../../../backend/firebase/viewprofile';
import { ClipLoader } from 'react-spinners';



export default function ReviewerMainNav({ setMobileMenuOpen, mobileMenuOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadNotificationsCount();
  const unreadMessages = useUnreadMessagesCount();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  const handleSearchInput = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      setIsSearching(true);
      setShowSuggestions(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchUsers(query, 1, 5);
          setSearchResults(results);
        } catch (error) {
          
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
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
      {/* Semantic nav for main navigation */}
      <nav className="bg-white shadow-sm" aria-label="Main navigation">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="flex justify-between h-16 items-center">
            {/* Desktop navigation links */}
            <section className="hidden md:flex items-center space-x-2">
              {/* Home */}
              <button
                onClick={() => navigate('/reviewer/dashboard')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/dashboard' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Home"
              >
                <FiHome className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
              </button>

              {/* Review Requests */}
              <button
                onClick={() => navigate('/reviewer/requests')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/requests' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Pending Review Requests"
              >
                <FiInbox className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Requests</p>
              </button>

              {/* Approved Projects */}
              <button
                onClick={() => navigate('/reviewer/assigned')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/assigned' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Approved Projects"
              >
                <ClipboardDocumentCheckIcon className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Approved</p>
              </button>

              {/* Review History */}
              <button
                onClick={() => navigate('/reviewer/history')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/history' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="Review History"
              >
                <FiClock className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">History</p>
              </button>

              {/* Messages with unread badge */}
              <button
                onClick={() => navigate('/reviewer/messages')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/messages' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="View messages"
              >
                <p className="relative">
                  <FiMessageSquare className="h-6 w-6 group-hover:text-blue-600" />
                  {/* Unread messages badge */}
                  {unreadMessages > 0 && (
                    <p className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold z-10">
                      {unreadMessages}
                    </p>
                  )}
                </p>
                <p className="text-xs mt-1 group-hover:text-blue-600">Messages</p>
              </button>

              {/* Account/Profile */}
              <button
                onClick={() => navigate('/reviewer/account')}
                className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/account' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="View profile"
              >
                <FiUser className="h-6 w-6 group-hover:text-blue-600" />
                <p className="text-xs mt-1 group-hover:text-blue-600">Account</p>
              </button>
            </section>

            {/* Search bar */}
            <section className="flex-1 max-w-md mx-4" ref={searchContainerRef}>
              <form onSubmit={handleSearch} className="relative" role="search">
                <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </section>
                <input
                  type="text"
                  placeholder="Search people..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                />

                {showSuggestions && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    {isSearching ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        <ClipLoader color="#3B82F6" size={16} className="mr-2" />
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {searchResults.map(user => (
                          <button
                            key={user.id}
                            onClick={() => navigate(`/profile/${user.id}`)}
                            className="w-full text-left hover:bg-gray-50 p-3 flex items-center space-x-3"
                          >
                            <div className="flex-shrink-0">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.fullName}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                                  {getAvatarInitials(user.fullName)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {[
                                  user.role && (user.role.charAt(0).toUpperCase() + user.role.slice(1)),
                                  user.institution,
                                  user.department
                                ].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery.trim() && (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </form>
            </section>

            {/* Notifications with unread badge */}
            <button
              onClick={() => navigate('/reviewer/notifications')}
              className={`group flex flex-col items-center justify-center p-3 relative ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
              aria-label="View alerts"
            >
              <span className="relative">
                <FiBell className="h-6 w-6 group-hover:text-blue-600" />
                {/* Unread notifications badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold z-10">
                    {unreadCount}
                  </span>
                )}
              </span>
            </button>

            {/* Branding and Logout (desktop only) */}
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

            {/* Mobile menu toggle button */}
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

        {/* Mobile menu (shows only when open) */}
        {mobileMenuOpen && (
          <section className="md:hidden bg-white shadow-md">
            <section className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button
                onClick={() => navigate('/account')}
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
          // Modal overlay and dialog for logout confirmation
          <section className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <motion.section
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <section className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <p className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</p>
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
                {/* Modal content */}
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
                {/* Modal actions */}
                <section className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
                </section>
              </motion.article>
            </section>
          </section>
        )}
      </AnimatePresence>
    </>
  );
}