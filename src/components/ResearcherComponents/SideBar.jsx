import {
  HomeIcon,
  UserCircleIcon,
  CalendarIcon,
  FolderIcon,
  DocumentIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { logOut } from "../../backend/firebase/authFirebase";

export default function SideBar({ isOpen, toggleSidebar }) {
  return (
    <section
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
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
  
          <h2 className="text-xl font-bold mb-12">Welcome back!</h2>
  
          {/* Sidebar tabs, onclick functionality not yet implemented */}
          <nav>
            <ul className="space-y-4 text-lg font-semibold">
              {/* This should be the default page, 
                  The user should be able to see all projects that are available on the site. 
                  The user should be able to search or filter by some project feature (name, profession...) */}
              <li className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer">
                <HomeIcon className="h-5 w-5" />
                Dashboard
              </li>
  
              <li className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer">
                <UserCircleIcon className="h-5 w-5" />
                My Profile
              </li>
  
              {/* The user should be able to view the projects they made,
                  track their projects,
                  search their projects,
                  and update/delete a project */}
              <li className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer">
                <FolderIcon className="h-5 w-5" />
                My Projects
              </li>
  
              <li className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer">
                <DocumentIcon className="h-5 w-5" />
                Documents
              </li>
  
              <li className="flex items-center gap-3 p-2 hover:bg-blue-600 rounded cursor-pointer">
                <Cog6ToothIcon className="h-5 w-5" />
                Settings
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
        </section>
      )}
    </section>
  );
  
}
