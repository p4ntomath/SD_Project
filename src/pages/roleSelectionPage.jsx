import React, { useState, useEffect, useContext } from 'react';
import { completeProfile } from '../backend/firebase/authFirebase';
import RoleSelectionForm from '../components/RoleSelctionForm';
import { ClipLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const RoleSelectionPage = () => {
  const { setRole, role, setLoading ,loading} = useContext(AuthContext);
  const [localLoading, setLocalLoading] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const profileData = {
        fullName: formData.fullName,
        role: formData.role,
        ...(formData.role === 'reviewer' && {
          expertise: formData.expertise,
          department: formData.department
        })
      };
      await completeProfile(formData.fullName, formData.role, profileData);
      setRole(formData.role);
      setProfileCompleted(true);
    } catch (error) {
      console.error("Error completing profile:", error.message);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileCompleted) {
      navigate('/home');
    }
    if(role){
      navigate('/home');
    }
  }, [profileCompleted, navigate, role]);

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {(localLoading || loading)? (
        <section className="flex justify-center items-center h-screen bg-gray-50" role="status">
          <ClipLoader 
            color="#3498db" 
            size={50} 
            data-testid="loading-spinner"
            aria-label="Loading"
          />
        </section>
      ) : (
        <RoleSelectionForm onSubmit={handleSubmit} />
      )}
    </section>
  );
};

export default RoleSelectionPage;
