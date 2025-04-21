import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import AuthContext from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, role, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!role && location.pathname !== '/complete-profile') {
            navigate('/complete-profile');
            return;
        }
    }, [user, role, loading, navigate, location.pathname]);

    if (loading && location.pathname !== '/login') {
        return (
            <main className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader color="#3498db" size={50} />
            </main>
        );
    }

    // If we got here, the route is authorized
    return children;
};

export default ProtectedRoute;