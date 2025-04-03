import React, { useState, useEffect } from "react";
import loginDisplay from "../assets/Screenshot 2025-03-31 194547.png";
import googleLogo from "../assets/googleLogo.png";
import facebookLogo from "../assets/facebookLogo.png";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

import { auth, db, provider } from "../firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // To handle loading state
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Check for empty fields
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true); // Start loading

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigate("/"); // Redirect to home after successful login
      })
      .catch((error) => {
        setError(error.message); // Display error message
      })
      .finally(() => {
        setLoading(false); // Stop loading
      });
  };

    const checkIfEmailExists = async (email) => {
      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    };

const handleGoogleLogin = async () => {
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
    <main className="min-h-screen flex md:flex-row flex-col justify-center items-center">
      <figure className="w-full h-screen bg-gray-100 md:w-1/2 flex  items-center justify-center p-8">
        <img
          src={loginDisplay}
          alt="Creative workspace illustration"
          className="h-auto object-contain rounded-lg shadow-md"
        />
      </figure>

      <section className="w-full md:w-1/2 flex flex-col items-center justify-center p-10 bg-white">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold">Welcome!</h1>
          <p className="text-lg font-semibold text-gray-600 mt-1">Login.</p>
        </header>

        <form className="space-y-4 max-w-md" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-sm text-gray-600">
            <label className="inline-flex items-center">
              <input type="checkbox" className="mr-1" />
              Remember me
            </label>
            <a to="/forgotpassword" className="text-green-600 hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Login
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
            onClick={handleGoogleLogin} 
          >
            <img src={googleLogo} alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
          <button
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <img src={facebookLogo} alt="Facebook" className="w-5 h-5" />
            <span>Continue with Facebook</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 max-w-md">
          Don't have an account?{" "}
          <a href="/signup" className="text-green-600 hover:underline">
            Sign Up
          </a>
        </p>
      </section>
    </main>
  );
}
