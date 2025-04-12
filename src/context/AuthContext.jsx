import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../backend/firebase/firebaseConfig'; // Adjust path as needed
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Firebase Auth user
  const [role, setRole] = useState(null);          // Role from Firestore
  const [userData, setUserData] = useState(null);  // Full Firestore document
  const [loading, setLoading] = useState(true);    // UI loading state
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setRole(data.role || null); // Store role separately if needed
      } else {
        setUserData(null);
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader color="#3498db" size={50} />
      </div>
    );
  }

  const value = {
    user,
    userData,
    role,
    setUser,
    setRole,
    setUserData,
    loading,
    setLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
