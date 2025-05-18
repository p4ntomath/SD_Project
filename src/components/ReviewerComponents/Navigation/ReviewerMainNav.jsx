import { FiHome, FiBell, FiUser, FiMenu, FiX, FiSearch, FiClock, FiInbox, FiMessageSquare } from 'react-icons/fi';
import { useState } from 'react';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { logOut } from '../../../backend/firebase/authFirebase';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutConfirmModal from '../../LogoutConfirmModal';
import { useUnreadNotificationsCount } from '../../../backend/firebase/notificationsUtil';


export default function ReviewerMainNav({ setMobileMenuOpen, mobileMenuOpen, onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadNotificationsCount();
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                >
                  {mobileMenuOpen ? (
                    <FiX className="h-6 w-6" />
                  ) : (
                    <FiMenu className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div className="ml-2 md:ml-0 flex space-x-8">
                <button
                  onClick={() => navigate('/reviewer/dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/reviewer/dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiHome className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Dashboard</span>
                </button>

                <button
                  onClick={() => navigate('/reviewer/requests')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/reviewer/requests'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiInbox className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Review Requests</span>
                </button>

                <button
                  onClick={() => navigate('/reviewer/assigned')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/reviewer/assigned'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ClipboardDocumentCheckIcon className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Assigned Projects</span>
                </button>

                <button
                  onClick={() => navigate('/reviewer/history')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/reviewer/history'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiClock className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Review History</span>
                </button>

                <button
                  onClick={() => navigate('/reviewer/notifications')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium relative ${
                    location.pathname === '/reviewer/notifications'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="relative">
                    <FiBell className="h-5 w-5 mr-1" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden md:inline">Notifications</span>
                </button>

                <button
                  onClick={() => navigate('/reviewer/messages')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/reviewer/messages'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiMessageSquare className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Messages</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              {onSearch && (
                <form onSubmit={handleSearch} className="hidden md:block mx-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </form>
              )}

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/reviewer/account')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/reviewer/account'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiUser className="h-5 w-5" />
                  <span className="hidden md:ml-2 md:inline">Account</span>
                </button>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="hidden md:inline">Logout</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}