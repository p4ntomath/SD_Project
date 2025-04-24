import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import AuthContext from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading || location.pathname === '/login') {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        if (!role && location.pathname !== '/complete-profile') {
            navigate('/complete-profile');
            return;
        }

        // Check if route requires specific roles
        if (allowedRoles && !allowedRoles.includes(role)) {
            navigate('/home');
            return;
        }
    }, [user, role, loading, navigate, location.pathname, allowedRoles]);

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