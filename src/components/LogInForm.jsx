import React, { use, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import googleLogo from '../assets/googleLogo.png';
import FormInput from './FormInput';
import { signIn, googleSignIn ,getUserRole} from "../backend/firebase/authFirebase";
import { ClipLoader } from "react-spinners";
import AuthContext from "../context/AuthContext";

const LoginForm = () => {
  
  const paths = {
    admin: "/admin",
    home: "/home",
    completeProfile: "/complete-profile",
  };
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const { setRole, setLoading } = useContext(AuthContext);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field-specific and form-level errors when typing
    setErrors(prev => ({ ...prev, [name]: '', form: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const user = await signIn(formData.email, formData.password);
      if(user){
        setIsLoading(false);
        setLoading(true);
        const role = await getUserRole(user.uid);
        setRole(role);
      }
      
      
      navigate(role === 'admin' ? paths.admin : paths.home);
    } catch (error) {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email. Please sign up.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.'
      };
      
      setErrors({ 
        form: errorMessages[error.code] || 'Login failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      const { isNewUser, user } = await googleSignIn();
      if (isNewUser) {
        navigate(paths.completeProfile);
      } else {
        const role = await getUserRole(user.uid);
        setRole(role);
        navigate(role === 'admin' ? paths.admin : paths.home);
      }
    } catch (error) {
      setErrors({ 
        form: error.code === 'auth/popup-closed-by-user' 
          ? 'Google sign-in was closed before completion.'
          : error.code === 'auth/popup-blocked'
          ? 'Google sign-in popup was blocked.'
          : 'Google sign-in failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold">Welcome!</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1">Login.</p>
      </header>
  
      {errors.form && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {errors.form}
        </div>
      )}
  
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login Form">
        <FormInput
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder=""
        />
  
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder=""
        />
  
        <section className="flex items-center justify-between text-sm text-gray-600">
          <label className="inline-flex items-center">
            <input 
              type="checkbox" 
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="mr-1" 
            />
            Remember me
          </label>
          <a href="/forgotpassword" className="text-green-600 hover:underline">Forgot Password?</a>
        </section>
  
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          {isLoading ? (
            <ClipLoader color="#ffffff" loading={isLoading} size={20} />
          ) : (
            "Login"
          )}
        </button>
      </form>
  
      <section className="flex items-center my-6 w-full" aria-label="Separator">
        <hr className="flex-grow border-gray-300" />
        <p className="mx-2 text-sm text-gray-500">OR</p>
        <hr className="flex-grow border-gray-300" />
      </section>
  
      <section className="space-y-3 w-full">
        <button 
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          {isLoading ? (
            <ClipLoader color="#4B5563" loading={isLoading} size={20} />
          ) : (
            <>
              <img src={googleLogo} alt="Google" className="w-5 h-5" />
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </section>
  
      <footer className="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <a href="/signup" className="text-green-600 hover:underline">Sign Up</a>
      </footer>
    </main>
  );
  
};

export default LoginForm;