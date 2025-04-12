import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Create context
const UserContext = createContext();

// Context provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase Auth user
  const [userData, setUserData] = useState(null); // Firestore user data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, userData, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for convenience
export const useUser = () => useContext(UserContext);
