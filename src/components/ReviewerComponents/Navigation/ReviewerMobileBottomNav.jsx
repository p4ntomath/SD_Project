import { FiHome, FiUser, FiClock } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function ReviewerMobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200" aria-label="Mobile navigation">
      <section className="flex justify-around">
        <button 
          onClick={() => navigate('/reviewer/home')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/home' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="Home"
        >
          <FiHome className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
        </button>

        <button 
          onClick={() => navigate('/reviewer/assigned')}
          className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/reviewer/assigned' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
          aria-label="Assigned Reviews"
        >
          <ClipboardDocumentCheckIcon className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Assigned</p>
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
          aria-label="View account"
        >
          <FiUser className="h-6 w-6 group-hover:text-blue-600" />
          <p className="text-xs mt-1 group-hover:text-blue-600">Account</p>
        </button>
      </section>
    </nav>
  );
}