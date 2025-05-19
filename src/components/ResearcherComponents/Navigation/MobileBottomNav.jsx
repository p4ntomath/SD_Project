import { FiHome, FiFolder, FiBell, FiUser, FiFileText, FiMessageSquare } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnreadNotificationsCount, useUnreadMessagesCount } from '../../../backend/firebase/notificationsUtil';

export default function MobileBottomNav ({ showForm, setShowForm }) {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useUnreadNotificationsCount();
  const unreadMessages = useUnreadMessagesCount();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200" aria-label="Mobile navigation">
      <section className="flex justify-around">
        <button 
          onClick={() => navigate('/home')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/home' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="Home"
        >
          <FiHome className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
        </button>

        <button 
          onClick={() => navigate('/projects')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/projects' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="Projects"
        >
          <FiFolder className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Projects</p>
        </button>

        <button 
          onClick={() => navigate('/documents')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/documents' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="View documents"
        >
          <FiFileText className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Documents</p>
        </button>

        <button 
          onClick={() => navigate('/notifications')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
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
          <p className="text-xs mt-1 group-hover:text-blue-600">Alerts</p>
        </button>

        <button
          onClick={() => navigate('/account')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/account' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="View account"
        >
          <FiUser className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Account</p>
        </button>
      </section>
    </nav>
  );
}