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

const googleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

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

const completeProfile = async (fullName, role, profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate required fields
    const requiredFields = ['institution', 'department', 'fieldOfResearch'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Use profileData if provided, otherwise fallback to basic data
    const userData = {
      fullName,
      role,
      institution: profileData.institution,
      department: profileData.department,
      fieldOfResearch: profileData.fieldOfResearch,
      researchTags: profileData.researchTags || [],
      bio: profileData.bio || '',
      updatedAt: new Date()
    };

    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
  } catch (error) {
    console.error("Error completing profile:", error.message);
    throw error;
  }
};

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error.message);
    throw error;
  }
};

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

const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { signUp, signIn, googleSignIn, resetPassword, logOut, authStateListener, completeProfile, getUserRole };
