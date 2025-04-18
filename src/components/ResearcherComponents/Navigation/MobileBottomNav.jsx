import { FiHome, FiFolder, FiBell, FiUser, FiFileText } from 'react-icons/fi';

export default function MobileBottomNav ({ showForm, setShowForm }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200" aria-label="Mobile navigation">
      <section className="flex justify-around">
      <button 
                    className="group flex flex-col items-center justify-center p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label="Home"
                >
                    <FiHome className="h-6 w-6 group-hover:text-blue-600" />
                    <p className="text-xs mt-1 group-hover:text-blue-600">Home</p>
                </button>
                <button 
                    className="group flex flex-col items-center justify-center p-3 text-gray-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label="Documents"
                >
                    <FiFolder className="h-6 w-6 group-hover:text-blue-600" />
                    <p className="text-xs mt-1 group-hover:text-blue-600">My Projects</p>
                </button>


                <button 
                    className="group flex flex-col items-center justify-center p-3 text-gray-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label="Documents"
                >
                    <FiFileText className="h-6 w-6 group-hover:text-blue-600" />
                    <p className="text-xs mt-1 group-hover:text-blue-600">Documents</p>
                </button>

                <button 
                    className="group flex flex-col items-center justify-center p-3 text-gray-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label="View projects"
                >
                    <FiBell className="h-6 w-6 group-hover:text-blue-600" />
                    <p className="text-xs mt-1 group-hover:text-blue-600">Alerts</p>
                </button>

                <button 
                    className="group flex flex-col items-center justify-center p-3 text-gray-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label="View profile"
                >
                    <FiUser className="h-6 w-6 group-hover:text-blue-600" />
                    <p className="text-xs mt-1 group-hover:text-blue-600">Profile</p>
                </button>
      </section>
    </nav>
  );
}