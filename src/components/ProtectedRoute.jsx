/**
 * @fileoverview Protected route component for role-based access control
 * @description Restricts access to routes based on user authentication and roles
 */

import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ClipLoader } from 'react-spinners';

/**
 * ProtectedRoute component that restricts access based on user roles
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Components to render if access is granted
 * @param {string[]} [props.allowedRoles] - Array of roles allowed to access this route
 * @returns {JSX.Element|null} Protected content or loading spinner
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, role, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading) {
            // Redirect unauthenticated users to login
            if (!user) {
                navigate('/login');
                return;
            }

            // Redirect users without roles to profile completion
            if (!role) {
                navigate('/complete-profile');
                return;
            }

            // Check role-based access permissions
            if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
                const homePath = role === 'admin' ? '/admin' : '/home';
                navigate(homePath);
                return;
            }
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