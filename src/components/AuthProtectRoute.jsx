import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";

const AuthProtectRoute = ({ children }) => {
    const { user, role, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (user && role === null) {
                navigate("/complete-profile", { replace: true });
            } else if (user) {
                // Redirect to appropriate dashboard based on role
                const path = role === 'admin' ? '/admin' : '/home';
                navigate(path, { replace: true });
            }
        }
    }, [user, role, loading, navigate]);

    if (loading) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader
                    data-testid="loading-spinner"
                    aria-label="Loading"
                    color="#3498db" 
                    size={50}
                />
            </div>
        );
    }

    return children;
};

export default AuthProtectRoute;
