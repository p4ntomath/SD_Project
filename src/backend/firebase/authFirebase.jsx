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

const signUp = async (fullName, email, password, role, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User signed up:", user);
    
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      fullName,
      email,
      role,
      ...additionalData,
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    console.error("Error signing up user:", error); // You can log for debugging
    throw new Error('Failed to create user'); // Provide a specific message
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
    console.error("Google sign-in error:", error.message);
  }
};

const completeProfile = async (fullName, role, profileData) => {
  try {
    const user = auth.currentUser;
    
    // Use profileData if provided, otherwise fallback to basic data
    const userData = profileData || {
      fullName,
      role
    };

    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error completing profile:", error.message);
    throw error; // Re-throw to handle in the component
  }
}

// 🔹 Email/Password Sign-In
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error; // Re-throw the error for handling in the calling function
  }
};


// 🔹 Password Reset
const resetPassword = async (email) => {
  try {
    // Check if email exists in Firestore "users" collection
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("No account found with this email.");
    }

    // If email exists, send password reset email
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// 🔹 Logout
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    return Promise.reject(error);
    
  }
};



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

// 🔹 Auth State Listener
const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { signUp, signIn, googleSignIn, resetPassword, logOut, authStateListener, completeProfile , getUserRole };
