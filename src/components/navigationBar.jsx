import { useState, useEffect } from "react";
import appLogo from '../assets/appLogo.png';
import { Link } from 'react-router-dom';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false); // Close mobile menu after clicking
    }
  };

  // Handle hash changes and initial load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        scrollToSection(hash);
      }
    };

    // Handle initial load with hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navItems = [
    { name: 'Home', sectionId: 'home' },
    { name: 'Features', sectionId: 'features' },
    { name: 'For Researchers', sectionId: 'for-researchers' },
    { name: 'For Reviewers', sectionId: 'for-reviewers' }
  ];

  return (
    <header className="fixed w-full z-50 bg-white shadow-md" role="banner">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <section className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <section className="flex-shrink-0">
            <button 
              onClick={() => scrollToSection('home')} 
              className="flex items-center space-x-3 group"
              aria-label="Go to home section"
            >
              <img 
                src={appLogo} 
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" 
                alt="Re:Search Logo" 
                width="40"
                height="40"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Re:Search
              </span>
            </button>
          </section>

          {/* Desktop Navigation */}
          <section className="hidden md:flex items-center space-x-8" role="navigation">
            {/* Primary Navigation */}
            <ul className="flex space-x-8 list-none" role="menu">
              {navItems.map((item) => (
                <li key={item.name} role="none">
                  <button
                    role="menuitem"
                    onClick={() => scrollToSection(item.sectionId)}
                    className="relative px-2 py-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
                    aria-label={`Navigate to ${item.name} section`}
                  >
                    {item.name}
                    <span 
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>

            {/* Auth Navigation */}
            <nav className="flex items-center space-x-4" aria-label="Authentication">
              <Link 
                to="/signup"
                className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                role="button"
              >
                Sign Up
              </Link>
              <Link 
                to="/login"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                role="button"
              >
                Login
              </Link>
            </nav>
          </section>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-lg p-2 inline-flex items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close main menu' : 'Open main menu'}
          >
            <svg
              className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </section>

        {/* Mobile menu */}
        <section 
          id="mobile-menu"
          className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white mt-2 rounded-lg shadow-xl border border-gray-100`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <ul className="px-2 pt-2 pb-3 space-y-1" role="menu">
            {navItems.map((item) => (
              <li key={item.name} role="none">
                <button
                  role="menuitem"
                  onClick={() => scrollToSection(item.sectionId)}
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200 text-left"
                  aria-label={`Navigate to ${item.name} section`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
          <nav 
            className="pt-4 pb-2 border-t border-gray-200"
            aria-label="Mobile authentication"
          >
            <section className="flex items-center px-3 space-x-3">
              <Link 
                to="/signup" 
                className="block w-1/2"
                role="button"
              >
                <span className="w-full px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg transition-colors duration-200 inline-block text-center">
                  Sign Up
                </span>
              </Link>
              <Link 
                to="/login" 
                className="block w-1/2"
                role="button"
              >
                <span className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 inline-block text-center">
                  Login
                </span>
              </Link>
            </section>
          </nav>
        </section>
      </nav>
    </header>
  );
};

export default NavBar;