import {
    HomeIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    XMarkIcon,
  } from "@heroicons/react/24/outline";
  import { logOut } from "../../backend/firebase/authFirebase";
  
  export default function ReviewerSidebar({ isOpen, toggleSidebar }) {
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
          <div className="p-4 h-full">
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
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                    aria-current="page"
                  >
                    <HomeIcon className="h-5 w-5" aria-hidden="true" />
                    Dashboard
                  </a>
                </li>
  
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                  >
                    <ClipboardDocumentCheckIcon className="h-5 w-5" aria-hidden="true" />
                    Assigned Reviews
                  </a>
                </li>
  
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                  >
                    <ClockIcon className="h-5 w-5" aria-hidden="true" />
                    Review History
                  </a>
                </li>
  
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                  >
                    <ChartBarIcon className="h-5 w-5" aria-hidden="true" />
                    Review Analytics
                  </a>
                </li>
  
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                  >
                    <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
                    Settings
                  </a>
                </li>
  
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer"
                    onClick={() => {
                      logOut();
                      window.location.href = "/login";
                    }}
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    Log out
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </aside>
    );
  }