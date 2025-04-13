import React, { useState, useEffect, useContext } from 'react';
import { completeProfile } from '../backend/firebase/authFirebase';
import RoleSelectionForm from '../components/RoleSelctionForm';
import { ClipLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';'../context/AuthContext';// Importing useNavigate for redirection

const RoleSelectionPage = () => {
  const {setRole,role} = useContext(AuthContext); // Importing setRole from AuthContext
  const [loading, setLoading] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false); // Track profile completion
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleSubmit = async (formData) => {
    setLoading(true); // Set loading to true when profile completion starts
    try {
      await completeProfile(formData.name, formData.role);
      setRole(formData.role); // Set the role in the context
      setProfileCompleted(true); // Mark profile as completed after the form is submitted
    } catch (error) {
      console.error("Error completing profile:", error.message);
    } finally {
        setLoading(false); // Set loading to false once the process is done
    }
  };

  // Effect to handle redirection once the profile is completed
  useEffect(() => {
    if (profileCompleted) {
      navigate('/home'); // Redirect to the home page after profile completion
    }
    if(role){
      navigate('/home'); // Redirect to the home page if role is already set
    }
  }, [profileCompleted, navigate,role]); // Trigger this effect only when profileCompleted changes

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {loading ? (
        <section className="flex justify-center items-center h-screen bg-gray-50">
          <ClipLoader color="#3498db" size={50} />
        </section>
      ) : (
        <RoleSelectionForm onSubmit={handleSubmit} />
      )}
    </section>
  );
};

export default RoleSelectionPage;
