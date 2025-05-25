/**
 * @fileoverview Authentication service functions for Firebase
 * @description Handles user authentication, registration, and profile management
 */

import { auth, db } from "./firebaseConfig";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {collection, query, where, getDocs } from "firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Create new user account with email and password
 * @param {string} fullName - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {Object} additionalData - Optional additional user data
 * @returns {Promise<Object>} Firebase user object
 */
const signUp = async (fullName, email, password, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      fullName,
      email,
      createdAt: new Date(),
      ...additionalData
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>} Object containing isNewUser flag and user data
 */
const googleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // New user → Store minimal data including userId
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email,
        fullName: user.displayName,
        createdAt: new Date(),
      });
      return { isNewUser: true, user };
    }
    
    return { isNewUser: false, user };
  } catch (error) {
    throw error;
  }
};

/**
 * Complete user profile after registration
 * @param {string} fullName - User's full name
 * @param {string} role - User's role (researcher, reviewer, admin)
 * @param {Object} profileData - Additional profile information
 */
const completeProfile = async (fullName, role, profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Clean and validate the data before saving
    const userData = {
      fullName: fullName || '',
      role: role || '',
      institution: profileData?.institution || '',
      department: profileData?.department || '',
      fieldOfResearch: profileData?.fieldOfResearch || '',
      researchTags: Array.isArray(profileData?.researchTags) ? profileData.researchTags : [],
      bio: profileData?.bio || '',
      updatedAt: new Date()
    };

    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
  } catch (error) {
    console.error("Error completing profile:", error.message);
    throw error;
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} Firebase user object
 */
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error.message);
    throw error;
  }
};

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 */
const resetPassword = async (email) => {
  try {
    // Check if email exists in Firestore "users" collection
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("No account found with this email.");
    }

    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

/**
 * Sign out current user
 */
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Get user's role from Firestore
 * @param {string} uid - User's unique ID
 * @returns {Promise<string|null>} User's role or null if not found
 */
const getUserRole = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().role;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

/**
 * Listen for authentication state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { signUp, signIn, googleSignIn, resetPassword, logOut, authStateListener, completeProfile, getUserRole };
