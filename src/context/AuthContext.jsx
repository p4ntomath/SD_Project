import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../backend/firebase/firebaseConfig'; // Adjust path as needed
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners'; // Importing the spinner

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component that wraps the app
export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // Store the role selection
  const [loading, setLoading] = useState(true); // To manage loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Fetch user role from Firestore
        fetchRoleFromDatabase(user.uid);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);// Redirect to the welcome page if not authenticated
      }
    });

    return () => unsubscribe();
  }, []);

  // In your AuthProvider component
  const fetchRoleFromDatabase = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setRole(userData.role || null);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole(null);
    } finally {
      setLoading(false); // Only set loading to false AFTER fetching role
    }
  };
  


  if (loading && location.pathname !== '/login') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader color="#3498db" size={50} />
      </div>
    );
  }

  const value = {
    user,
    role,
    setUser,
    setRole,
    loading,
    setLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;