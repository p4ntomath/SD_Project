import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import AuthContext from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        // Only redirect to complete-profile for Google sign-in users who don't have a role
        const isFromGoogle = user.providerData?.[0]?.providerId === 'google.com';
        if (!role && isFromGoogle && location.pathname !== '/complete-profile') {
            navigate('/complete-profile');
            return;
        }

        // Check if route requires specific roles
        if (allowedRoles && !allowedRoles.includes(role)) {
            navigate('/home');
            return;
        }
    }, [user, role, loading, navigate, location.pathname, allowedRoles]);

    // Show loading spinner while authentication state is being determined
    if (loading) {
        return (
            <main className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader data-testid="clip-loader" color="#3498db" size={50} />
            </main>
        );
    }

    return children;
};

export default ProtectedRoute;