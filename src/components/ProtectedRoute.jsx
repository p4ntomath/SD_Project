import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipLoader } from 'react-spinners';

const ProtectedRoute = ({ children }) => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return; // Wait until auth state is loaded

        // If not logged in, redirect to login
        if (!user) {
            navigate('/login');
            return;
        }

        // Special handling for complete-profile route
        if (location.pathname === '/complete-profile') {
            // If user already has role, redirect to home
            if (role) {
                navigate('/authHomeTest');
            }
            // Else stay on complete-profile
            return;
        }

        // For all other protected routes, check if role exists
        if (!role) {
            navigate('/complete-profile');
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