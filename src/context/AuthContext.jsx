/**
 * @fileoverview Authentication context provider for the application
 * @description Manages global authentication state and user role information
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../backend/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';

const AuthContext = createContext();

// Cache for storing user roles to reduce Firestore queries
const roleCache = new Map();

/**
 * AuthProvider component that wraps the app with authentication context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with authentication state
 */
export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  /**
   * Fetch user role from Firestore database
   * @param {string} uid - User's unique identifier
   */
  const fetchRoleFromDatabase = async (uid) => {
    try {
      if (!uid) {
        setRole(null);
        return;
      }

      // Check cache first to avoid unnecessary API calls
      if (roleCache.has(uid)) {
        setRole(roleCache.get(uid));
        return;
      }

      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userRole = userData?.role || null;
          
          // Cache the role
          roleCache.set(uid, userRole);
          setRole(userRole);
          setConnectionError(null);
        } else {
          console.log('No user document found for UID:', uid);
          setRole(null);
        }
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        setConnectionError('Connection error. Some features may be unavailable.');
        // Still try to use cached role if available
        if (roleCache.has(uid)) {
          setRole(roleCache.get(uid));
        } else {
          setRole(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchRoleFromDatabase:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchRoleFromDatabase(user.uid);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Show loading spinner during auth state determination
  if (loading && location.pathname !== '/login') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader color="#3498db" size={50} />
      </div>
    );
  }

  const connectionWarning = connectionError && (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
      <p className="font-bold">Connection Warning</p>
      <p>{connectionError}</p>
    </div>
  );

  const value = {
    user,
    role,
    setUser,
    setRole,
    loading,
    setLoading,
    connectionError,
    clearRoleCache: () => roleCache.clear()
  };

  return (
    <AuthContext.Provider value={value}>
      {connectionWarning}
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;