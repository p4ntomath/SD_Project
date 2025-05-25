/**
 * @fileoverview Sign-up page component with side-by-side layout
 * @description Renders the user registration page with welcome image and signup form
 */

import SignUpForm from '../components/SignUpForm';
import welcomeImage from '../assets/welcomeDisplayImage.jpg';

/**
 * SignUpPage component that displays the user registration interface
 * @returns {JSX.Element} Sign-up page with welcome image and registration form
 */
const SignUpPage = () => (
  <section className="min-h-screen flex flex-col md:flex-row">
    <section className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8 rounded-tr-2xl rounded-br-2xl">
      <figure>
        <img
          src={welcomeImage}
          alt="Welcome to research collaboration platform"
          className="h-auto object-contain rounded-lg shadow-md"
        />
      </figure>
    </section>
    <section className="md:w-1/2 flex items-center justify-center p-8 bg-white">
      <SignUpForm />
    </section>
  </section>
);

export default SignUpPage;