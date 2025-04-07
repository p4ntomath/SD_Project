import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipLoader } from 'react-spinners';

const ProtectedRoute = ({ children }) => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return; // Wait until auth state and role are both loaded
    
        if (!user) {
            navigate('/login');
            return;
        }
    
        // Wait for role state to be fully determined before making navigation decisions
        if (role === null) 
            {
                navigate('/complete-profile');
                return;
            }

    
        if (location.pathname === '/complete-profile' && role) {
            navigate('/authHomeTest');
            return;
        }
    }, [user, role, loading, navigate, location.pathname]);
    

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader color="#3498db" size={50} />
            </div>
        );
    }

    // If we got here, the route is authorized
    return children;
};

export default ProtectedRoute;