import { useState } from "react";
import appLogo from '../assets/appLogo.png';
import { Link } from 'react-router-dom';
import '../styling/welcomePage.css';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed-header ">
      <nav className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4" aria-label="Main navigation">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src={appLogo} className="imageLogo" alt="app Logo" />
          <h1 className="logo">Re:Search</h1>
        </a>
  
        <section className="flex md:order-2 space-x-3 md:space-x-2 rtl:space-x-reverse">
          <Link to="/login">
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 font-bold rounded-lg text-sm px-6 py-2 text-center"
            >
              Login
            </button>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-controls="navbar-sticky"
            aria-expanded={isOpen}
          >
            <p className="sr-only">Open main menu</p>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </section>
  
        <section
          className={`items-center justify-between ${isOpen ? "block" : "hidden"} w-full md:flex md:w-auto md:order-1`}
          id="navbar-sticky">
          <ul className="nav-list">
            <li> <a href="/"  className="nav-link" aria-current="page"> Home  </a></li>
            <li> <a href="/" className="nav-link"> About </a></li>
            <li><a href="/"className="nav-link">Services</a></li>
            <li><a href="/" className="nav-link">Contact</a></li> 
          </ul>
        </section>
      </nav>
    </header>
  );
  
};

export default NavBar;