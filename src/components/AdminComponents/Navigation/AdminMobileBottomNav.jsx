import { FiHome, FiUsers, FiFolder, FiDollarSign } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminMobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" aria-label="Admin mobile navigation">
      <ul className="max-w-md mx-auto px-4 h-16 flex items-center justify-around" role="menubar">
        <li role="none">
          <button
            onClick={() => navigate('/admin')}
            className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
            aria-label="Dashboard"
            role="menuitem"
          >
            <FiHome className="h-6 w-6 group-hover:text-blue-600" />
            <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
          </button>
        </li>
        <li role="none">
          <button
            onClick={() => navigate('/admin/users')}
            className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/users' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
            aria-label="Users"
            role="menuitem"
          >
            <FiUsers className="h-6 w-6 group-hover:text-blue-600" />
            <p className="text-xs mt-1 group-hover:text-blue-600">Users</p>
          </button>
        </li>
        <li role="none">
          <button
            onClick={() => navigate('/admin/projects')}
            className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/projects' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
            aria-label="Projects"
            role="menuitem"
          >
            <FiFolder className="h-6 w-6 group-hover:text-blue-600" />
            <p className="text-xs mt-1 group-hover:text-blue-600">Projects</p>
          </button>
        </li>
        <li role="none">
          <button
            onClick={() => navigate('/admin/funding')}
            className={`group flex flex-col items-center justify-center p-3 ${location.pathname === '/admin/funding' ? 'text-blue-600' : 'text-gray-600'} hover:bg-blue-50 rounded-lg transition-all duration-200`}
            aria-label="Funding"
            role="menuitem"
          >
            <FiDollarSign className="h-6 w-6 group-hover:text-blue-600" />
            <p className="text-xs mt-1 group-hover:text-blue-600">Funding</p>
          </button>
        </li>
      </ul>
    </nav>
  );
}