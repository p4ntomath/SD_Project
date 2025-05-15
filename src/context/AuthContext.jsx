import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../backend/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleFromDatabase = async (uid) => {
    try {
      if (!uid) {
        setRole(null);
        return;
      }

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setRole(userData?.role || null);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole(null);
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;