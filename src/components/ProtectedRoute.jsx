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

        // If user is authenticated but has no role, redirect to complete profile
        // unless they're already on the complete-profile page
        if (!role && location.pathname !== '/complete-profile') {
            navigate('/complete-profile', { state: { from: location.pathname } });
            return;
        }

        // Only check role requirements if the route has allowedRoles specified
        if (allowedRoles && !allowedRoles.includes(role)) {
            // Redirect to appropriate home page based on role
            const homePath = role === 'admin' ? '/admin' : '/home';
            navigate(homePath);
            return;
        }
    }, [user, role, loading, navigate, location.pathname, allowedRoles]);

    // Show loading spinner while authentication state is being determined
    if (loading && location.pathname !== '/login') {
        return (
            <main className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader data-testid="clip-loader" color="#3498db" size={50} />
            </main>
        );
    }

    // If we got here, the route is authorized
    return children;
};

export default ProtectedRoute;