import { useState, useEffect } from "react";
import appLogo from '../assets/appLogo.png';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from "../firebase"; // Make sure to import Firebase auth
import { signOut } from "firebase/auth"; // Import the signOut function from Firebase

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null); // Track user authentication state
  const navigate = useNavigate();

  // Check authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Set the user state when the auth state changes
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      window.location.reload(); // Refresh the page after logout
      await signOut(auth); // Sign out user
      
      //navigate("/"); // Redirect to home after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="bg-white fixed w-full z-20 top-0 start-0">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src={appLogo} className="h-8" alt="app Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap">Re:Search</span>
        </a>

        <div className="flex md:order-2 space-x-3 md:space-x-2 rtl:space-x-reverse">
          {user ? (
            <button
              onClick={handleLogout}
              type="button"
              className="text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm px-6 py-2 text-center"
            >
              Logout
            </button>
          ) : (
            <Link to="/login">
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 font-bold rounded-lg text-sm px-6 py-2 text-center"
              >
                Login
              </button>
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-controls="navbar-sticky"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
        </div>

        <div className={`items-center justify-between ${isOpen ? "block" : "hidden"} w-full md:flex md:w-auto md:order-1`} id="navbar-sticky">
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white">
            <li>
              <a href="/" className="block py-2 px-3 text-white bg-blue-700 rounded-sm md:bg-transparent md:text-blue-700 md:p-0" aria-current="page">Home</a>
            </li>
            <li>
              <a href="/" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0">About</a>
            </li>
            <li>
              <a href="/" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0">Services</a>
            </li>
            <li>
              <a href="/" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
