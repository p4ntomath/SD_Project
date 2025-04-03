import React, { useState } from "react";
import FormInput from "./FormInput";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, provider } from "../firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import googleLogo from "../assets/googleLogo.png";
import facebookLogo from "../assets/facebookLogo.png";

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const roles = [
    { value: "", label: "Select your role", disabled: true },
    { value: "researcher", label: "Researcher" },
    { value: "reviewer", label: "Reviewer" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match";
    }
    if (!formData.role.trim()) newErrors.role = "Please select a role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkIfEmailExists = async (email) => {
    const userRef = doc(db, "users", email);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const emailExists = await checkIfEmailExists(formData.email);
    if (emailExists) {
      try {
        // If email exists, log the user in
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        console.log("Login successful:", user);
        navigate("/home");
      } catch (error) {
        setErrors({ firebase: "Login failed. " + error.message });
      }
    } else {
      try {
        // If email doesn't exist, create new account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          createdAt: new Date(),
        });

        // Send email verification
        await sendEmailVerification(user);
        alert("Verification email sent. Please check your inbox.");

        navigate("/profile-completion");
      } catch (error) {
        setErrors({ firebase: error.message });
      }
    }
  };

  const handleGoogleSignup = async () => {
    try {
      // Authenticate user with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Reference Firestore user document
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        // If user exists, log them in (navigate to the profile completion or home)
        console.log("User already exists, logging in:", user);
        navigate("/"); // Redirect after login
      } else {
        // If user does not exist, create a new Firestore document
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          profileQuestions: {
            profession: "Not set",
            role: "Not set",
          },
          createdAt: new Date(),
        });
        console.log("Google Sign-up Successful:", user);
        navigate("/profile-completion"); // Redirect after signup
      }
    } catch (error) {
      console.error("Error during Google sign-up:", error);
      alert(error.message);
    }
  };
  

  return (
    <div className="w-full max-w-md">
      <h2 className="text-5xl font-bold text-gray-800 mb-2">Create Account</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Already have an account?{" "}
        <a href="/login" className="text-green-600 hover:underline">
          Log in
        </a>
      </p>
      {errors.firebase && <p className="text-red-500">{errors.firebase}</p>}
      <form onSubmit={handleSignup} className="space-y-4">
        <FormInput
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        <div className="mb-4">
          <label className="block text-sm font-medium">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.role ? "border-red-500" : "border-gray-300"
            }`}
          >
            {roles.map((role) => (
              <option
                key={role.value}
                value={role.value}
                disabled={role.disabled}
              >
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-red-600 text-sm">{errors.role}</p>}
        </div>
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        <FormInput
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          Sign Up
        </button>
      </form>
      <div className="flex items-center my-6 max-w-md">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-2 text-sm text-gray-500">OR</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <div className="space-y-3 max-w-md">
        <button
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          onClick={handleGoogleSignup}
        >
          <img src={googleLogo} alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
        <button className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
          <img src={facebookLogo} alt="Facebook" className="w-5 h-5" />
          <span>Continue with Facebook</span>
        </button>
      </div>
    </div>
  );
};

export default SignUpForm;
