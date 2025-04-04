import { auth } from "./firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Sign up function
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Sign-up error:", error.message);
    throw error;
  }
};

// Sign in function
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Sign-in error:", error.message);
    throw error;
  }
};

// Logout function
const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Logout error:", error.message);
    throw error;
  }
};

// Auth state listener
const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { signUp, signIn, logOut, authStateListener };
