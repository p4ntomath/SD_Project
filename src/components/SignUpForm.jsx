/**
 * @fileoverview User registration form component with email/password and Google authentication
 * @description Handles new user registration with comprehensive form validation
 */

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "./FormInput";
import googleLogo from "../assets/googleLogo.png";
import { signUp, googleSignIn } from "../backend/firebase/authFirebase.jsx";
import { ClipLoader } from "react-spinners";
import AuthContext from "../context/AuthContext";

/**
 * SignUpForm component for user registration
 * @returns {JSX.Element} Registration form with validation and Google auth option
 */
const SignUpForm = () => {
  const paths = {
    success: "/complete-profile",
    successGoogle: "/complete-profile",
  };
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { setLoading } = useContext(AuthContext);

  /**
   * Handle form input changes and clear field errors
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Validate all form fields with comprehensive password requirements
   * @returns {boolean} True if all validations pass
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (
        formData.password.length < 8 ||
        !/[A-Za-z]/.test(formData.password) ||
        !/[0-9]/.test(formData.password) ||
        !/[^A-Za-z0-9]/.test(formData.password)
      ) {
        newErrors.password =
          "Password must be at least 8 characters, contain at least one letter, number, and special character (@,#,!)";
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission for email/password registration
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const user = await signUp(formData.fullName, formData.email, formData.password);
      setLoading(true);
      if(user) {
        navigate(paths.success, { 
          state: { 
            userId: user.uid, 
            email: user.email, 
            name: formData.fullName,
            isEmailSignup: true 
          } 
        });
      }
    } catch (error) {
      const errorMessages = {
        'auth/email-already-in-use': 'Email Already Exists: This email address is already registered. Please try logging in or use a different email.',
        'auth/invalid-email': 'Invalid Email: Please enter a valid email address.',
        'auth/weak-password': 'Weak Password: Please choose a stronger password.',
        'auth/operation-not-allowed': 'Sign up is temporarily disabled. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection and try again.'
      };
      
      const errorMessage = errorMessages[error.code] || `Sign up failed: ${error.message || 'An unexpected error occurred'}`;
      
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: errorMessage });
      } else {
        setErrors({ form: errorMessage });
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth registration/login
   */
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setLoading(true);
    try {
      const { isNewUser, user } = await googleSignIn();
      if (isNewUser) {
        navigate("/complete-profile", { 
          state: { 
            userId: user.uid, 
            email: user.email, 
            name: user.displayName,
            isGoogleSignup: true 
          } 
        });
      } else {
        navigate(paths.success);
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setErrors({ form: "Google sign-in was closed before completion." });
      }
      else if (error.code === "auth/popup-blocked") {
        setErrors({ form: "Google sign-in popup was blocked." });
      }
      else if (error.code === "auth/invalid-credential") {
        setErrors({ form: "Invalid credentials. Please try again." });
      }
      else {
        setErrors({ form: 'Google sign-up failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md">
      <header>
        <h2 aria-label="heading" className="text-5xl font-bold text-gray-800 mb-2">Create Account</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-sm text-green-600 hover:underline">
            Log in
          </a>
        </p>
      </header>

      {errors.form && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="sr-only">Create Account Form</legend>

          <FormInput
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />
          <FormInput
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
          {!errors.password && (
            <p className="mt-1 text-xs text-gray-500">
              Make it strong! Include:
              <br />• At least 8 characters
              <br />• Both letters and numbers
              <br />• Symbols like (@,!,#)
            </p>
          )}
          
          <FormInput
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />
        </fieldset>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          {isLoading ? <ClipLoader color="#ffffff" loading={isLoading} size={20} /> : "Sign Up"}
        </button>

        <section className="flex items-center my-6 w-full" aria-label="Separator">
          <hr className="flex-grow border-gray-300" />
          <p className="mx-2 text-sm text-gray-500">OR</p>
          <hr className="flex-grow border-gray-300" />
        </section>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          <img src={googleLogo} alt="Google" className="w-5 h-5" />
          <p>Continue with Google</p>
        </button>
      </form>
    </main>
  );
};

export default SignUpForm;
