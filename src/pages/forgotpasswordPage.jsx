import { useState } from 'react';
import { Link } from 'react-router-dom';
import welcomeImage from '../assets/welcomeDisplayImage.jpg';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  //PLEASE EDIT THIS FUNCTION TO HANDLE SUBMISSIONS
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // call the password reset API here
    console.log('Password reset requested for:', email);
    setIsSubmitted(true);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Image Section - Hidden on mobile */}
      <div className="hidden md:block md:w-1/2 bg-gray-100 flex items-center justify-center p-8 rounded-tr-2xl rounded-br-2xl">
        <div className="h-full w-full flex items-center justify-center"> {/* New wrapper div */}
            <img
            src={welcomeImage}
            alt="Welcome"
            className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl-2xl"
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
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                  />
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                >
                  Send Reset Link
                </button>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
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