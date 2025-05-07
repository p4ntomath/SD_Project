import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { logOut } from "../../backend/firebase/authFirebase";

export default function ReviewerSidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside 
      aria-label="Reviewer navigation menu"
      className={`
        bg-blue-700 text-white
        ${isOpen ? "w-64" : "w-0"}
        fixed h-full z-10
        transition-all duration-300 ease-in-out
        rounded-tr-2xl
      `}
    >
      {isOpen && (
        <section className="p-4 h-full">
          {/* Close button (visible only on small screens) */}
          <button
            onClick={toggleSidebar}
            className="text-white mb-4 block lg:hidden"
            aria-label="Close navigation menu"
            aria-expanded={isOpen}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Sidebar header */}
          <header>
            <h2 className="text-xl font-bold mb-12">Welcome back!</h2>
          </header>

          {/* Main navigation */}
          <nav aria-label="Reviewer navigation options">
            <ul className="space-y-4 text-lg font-semibold">
              <li>
                <button
                  onClick={() => navigate('/reviewer/dashboard')}
                  className={`w-full flex items-center gap-3 p-2 ${location.pathname === '/reviewer/dashboard' ? 'bg-blue-600' : ''} hover:bg-blue-600 rounded cursor-pointer`}
                  aria-current={location.pathname === '/reviewer/dashboard' ? 'page' : undefined}
                >
                  <HomeIcon className="h-5 w-5" aria-hidden="true" />
                  Dashboard
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate('/reviewer/requests')}
                  className={`w-full flex items-center gap-3 p-2 ${location.pathname === '/reviewer/requests' ? 'bg-blue-600' : ''} hover:bg-blue-600 rounded cursor-pointer`}
                  aria-current={location.pathname === '/reviewer/requests' ? 'page' : undefined}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5" aria-hidden="true" />
                  Review Requests
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate('/reviewer/assigned')}
                  className={`w-full flex items-center gap-3 p-2 ${location.pathname === '/reviewer/assigned' ? 'bg-blue-600' : ''} hover:bg-blue-600 rounded cursor-pointer`}
                  aria-current={location.pathname === '/reviewer/assigned' ? 'page' : undefined}
                >
                  <ClipboardDocumentCheckIcon className="h-5 w-5" aria-hidden="true" />
                  Approved Projects
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate('/reviewer/history')}
                  className={`w-full flex items-center gap-3 p-2 ${location.pathname === '/reviewer/history' ? 'bg-blue-600' : ''} hover:bg-blue-600 rounded cursor-pointer`}
                  aria-current={location.pathname === '/reviewer/history' ? 'page' : undefined}
                >
                  <ClockIcon className="h-5 w-5" aria-hidden="true" />
                  Review History
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate('/reviewer/analytics')}
                  className={`w-full flex items-center gap-3 p-2 ${location.pathname === '/reviewer/analytics' ? 'bg-blue-600' : ''} hover:bg-blue-600 rounded cursor-pointer`}
                  aria-current={location.pathname === '/reviewer/analytics' ? 'page' : undefined}
                >
                  <ChartBarIcon className="h-5 w-5" aria-hidden="true" />
                  Review Analytics
                </button>
              </li>

              <li>
                <button
                  onClick={() => navigate('/reviewer/settings')}
                  className={`w-full flex items-center gap-3 p-2 ${location.pathname === '/reviewer/settings' ? 'bg-blue-600' : ''} hover:bg-blue-600 rounded cursor-pointer`}
                  aria-current={location.pathname === '/reviewer/settings' ? 'page' : undefined}
                >
                  <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
                  Settings
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    logOut();
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  Log out
                </button>
              </li>
            </ul>
          </nav>
        </section>
      )}
    </aside>
  );
}