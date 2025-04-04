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
import { doc, setDoc, getDoc } from "firebase/firestore";

// 🔹 Handle Firebase Auth Errors
const handleAuthError = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      throw new Error("Email is already in use.");
    case "auth/weak-password":
      throw new Error("Password should be at least 6 characters.");
    case "auth/user-not-found":
      throw new Error("No user found with this email.");
    case "auth/wrong-password":
      throw new Error("Incorrect password.");
    case "auth/network-request-failed":
      throw new Error("Network error. Check your connection.");
    default:
      throw new Error(error.message);
  }
};

// 🔹 Email/Password Sign-Up
const signUp = async (fullName, email, password, role) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user details in Firestore including the userId (which is the Firebase UID)
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid, // Storing the userId
      fullName,
      email,
      role,
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    handleAuthError(error);
  }
};

// 🔹 Google Sign-In
const googleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // New user → Store minimal data including userId
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid, // Storing the userId
        email: user.email,
        createdAt: new Date(),
      });
      // Return new user info
      return { isNewUser: true, user };
    } else {
      // Existing user → Proceed normally
      return { isNewUser: false, user };
    }
  } catch (error) {
    handleAuthError(error);
  }
};

const completeProfile = async (fullName, role) => {
  try {
    const user = auth.currentUser;
    await setDoc(doc(db, "users", user.uid), {
      fullName,
      role,
    }, { merge: true });
  } catch (error) {
    handleAuthError(error);
  }
}



// 🔹 Email/Password Sign-In
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    handleAuthError(error);
  }
};


// 🔹 Password Reset
const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return "Password reset email sent!";
  } catch (error) {
    handleAuthError(error);
  }
};

// 🔹 Logout
const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Logout error:", error.message);
  }
};

// 🔹 Auth State Listener
const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { signUp, signIn, googleSignIn, resetPassword, logOut, authStateListener, completeProfile };
