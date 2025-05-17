import { FiHome, FiUser, FiBell, FiInbox } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { useUnreadNotificationsCount } from '../../../backend/firebase/notificationsUtil';

export default function ReviewerMobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useUnreadNotificationsCount();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200" aria-label="Mobile navigation">
      <section className="flex justify-around">
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
                onClick={() => navigate('/reviewer/notifications')}
                className={`group flex flex-col items-center justify-center p-3 relative ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
                aria-label="View alerts"
              >
                <span className="relative">
                  <FiBell className="h-6 w-6 group-hover:text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold z-10">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <p className="text-xs mt-1 group-hover:text-blue-600">Notifications</p>
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
          onClick={() => navigate('/reviewer/account')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/account' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="View account"
        >
          <FiUser className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Account</p>
        </button>
      </section>
    </nav>
  );
}