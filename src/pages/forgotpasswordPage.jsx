/* This code snippet is a React component named `ForgotPasswordPage`. It is a functional component that
handles the functionality for resetting a user's password. Here is a breakdown of what the code is
doing: */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../backend/firebase/authFirebase';
import { ClipLoader } from 'react-spinners';
import welcomeImage from '../assets/welcomeDisplayImage.jpg';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * The function `handleSubmit` is an asynchronous function that handles form submission, validates an
   * email input, sends a reset password request, and updates the state accordingly.
   * @returns The `handleSubmit` function returns either an error message if there is a validation
   * error or an error during the password reset process, or it sets the `isSubmitted` state to true if
   * the password reset is successful.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Image Section - Hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 bg-gray-100 items-center justify-center p-8 rounded-tr-2xl rounded-br-2xl">
        <div className="h-full w-full flex items-center justify-center">
          <img
            src={welcomeImage}
            alt="Welcome"
            className="h-auto object-contain rounded-lg shadow-md"
          />
        </div>
      </div>
      
      {/* Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Reset Your Password</h2>
          
          {isSubmitted ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
                Password reset link has been sent to your email.
              </div>
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-md ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex justify-center items-center"
                >
                  {loading ? (
                    <ClipLoader color="#ffffff" size={20} />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="text-green-600 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;