import React, { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import googleLogo from '../assets/googleLogo.png';
import FormInput from './FormInput';
import { signIn, googleSignIn } from "../backend/firebase/authFirebase";
import { ClipLoader } from "react-spinners";// Import the AuthContext

const LoginForm = () => {

  const paths = {
    success: "/authHomeTest",
    completeProfile: "/complete-profile",
  };
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      navigate(paths.success);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setErrors({ form: 'User not found. Please sign up.' });
      }
      else if (error.code === 'auth/invalid-credential') {
        setErrors({ form: 'Invalid Credentials' });
      }
      else if (error.code === 'auth/wrong-password') {
        setErrors({ form: 'Wrong Password' });
      }
      else{
        setErrors({ form: error.code });}
    }
    setLoading(false);
  };



  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { isNewUser } = await googleSignIn();
      if (isNewUser) {
        navigate(paths.completeProfile);
      } else {
        navigate(paths.success);
      }
    } catch (error) {
      setErrors({ form: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold">Welcome!</h1>
        <p className="text-lg font-semibold text-gray-600 mt-1">Login.</p>
      </header>

      {errors.form && <p className="text-red-600 mb-4">{errors.form}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email Address"
          type="email"
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

        <div className="flex items-center justify-between text-sm text-gray-600">
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          {loading ? (
            <ClipLoader color="#ffffff" loading={loading} size={20} />
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="flex items-center my-6 w-full">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-2 text-sm text-gray-500">OR</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <div className="space-y-3 w-full">
        <button 
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          {loading ? (
            <ClipLoader color="#4B5563" loading={loading} size={20} />
          ) : (
            <>
              <img src={googleLogo} alt="Google" className="w-5 h-5" />
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <a href="/signup" className="text-green-600 hover:underline">Sign Up</a>
      </p>
    </div>
  );
};

export default LoginForm;