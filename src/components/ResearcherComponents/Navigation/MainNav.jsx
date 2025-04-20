import { FiHome, FiFolder, FiList, FiUser, FiMenu, FiX, FiSearch, FiBell } from 'react-icons/fi';
import { useState } from 'react';
import {DocumentIcon} from "@heroicons/react/24/outline";
import { logOut } from '../../../backend/firebase/authFirebase';

export default function MainNav({ showForm, setShowForm, setMobileMenuOpen, mobileMenuOpen }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Please implement search functionality here
    console.log('Searching for:', searchQuery); 
  };

  return (
    <nav className="bg-white shadow-sm">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="flex justify-between h-16 items-center">
          {/* Desktop Navigation */}
          <section className="hidden md:flex items-center space-x-2">
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
                    <DocumentIcon className="h-6 w-6 group-hover:text-blue-600" />
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
                    <p className="text-xs mt-1 group-hover:text-blue-600">Account</p>
                </button>
            </section>

          {/* Search Bar */}
          <section className="flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </section>

        <section className='hidden md:flex items-center space-x-6'>
          {/* Logo/Title */}
          <section className="hidden md:flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">Research Portal</h1>
            
          </section>

          <section  className="hidden md:flex items-center">
          <button
              className="bg-gray-500 hover:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center"
              aria-label="Create new project"
              onClick={() => {
                logOut();
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </section>
          </section>


          {/* Mobile menu button */}
          <section className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </section>
        </section>
      </section>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <section className="md:hidden bg-white shadow-md">
          <section className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        
            <button
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              aria-label="View profile"
            >
              My Profile
            </button>

           
          </section>
        </section>
      )}
    </nav>
  );
}