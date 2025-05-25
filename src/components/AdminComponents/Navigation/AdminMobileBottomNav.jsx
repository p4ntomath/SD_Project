import { FiHome, FiFolder, FiDollarSign, FiBell } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnreadNotificationsCount } from '../../../backend/firebase/notificationsUtil';

export default function AdminMobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  // Custom hooks to get unread notifications/messages count
  const unreadCount = useUnreadNotificationsCount();
    

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <section className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        <button 
          onClick={() => navigate('/admin')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="Dashboard"
        >
          <FiHome className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
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
        <button
        onClick={() => navigate('/admin/notifications')}
        className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
        aria-label="Notifications"
        role="menuitem"
      >
         <span className="relative">
                <FiBell className="h-6 w-6 group-hover:text-blue-600" />
                {/* Show unread notifications badge if any */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold z-10">
                    {unreadCount}
                  </span>
                )}
              </span>
        <span className="text-xs mt-1 group-hover:text-blue-600">Notifications</span>
      </button>
                       
      </section>
    </nav>
  );
}