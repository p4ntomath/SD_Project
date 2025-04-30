import { useState } from "react";
import appLogo from '../assets/appLogo.png';
import { Link } from 'react-router-dom';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full z-50 bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={appLogo} 
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" 
              alt="Re:Search Logo" 
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Re:Search
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-8">
              {[
                { name: 'Home', path: '/' },
                { name: 'Features', path: '/#features' },
                { name: 'About', path: '/#about' },
                { name: 'Contact', path: '/#contact' },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className="relative px-2 py-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/signup">
                <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Sign Up
                </button>
              </Link>
              <Link to="/login">
                <button className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                  Login
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-lg p-2 inline-flex items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white mt-2 rounded-lg shadow-xl border border-gray-100`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {[
              { name: 'Home', path: '/' },
              { name: 'Features', path: '/#features' },
              { name: 'About', path: '/#about' },
              { name: 'Contact', path: '/#contact' },
            ].map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 pb-2 border-t border-gray-200">
              <div className="flex items-center px-3 space-x-3">
                <Link to="/signup" className="block w-1/2">
                  <button className="w-full px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg transition-colors duration-200">
                    Sign Up
                  </button>
                </Link>
                <Link to="/login" className="block w-1/2">
                  <button className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200">
                    Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;