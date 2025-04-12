import React, { useEffect,useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import AuthContext from "../context/AuthContext"; // Import the AuthContext

const ProtectedRoute = ({ children }) => {
    
    const { user, role ,loading} = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => { // Wait until auth state and role are both loaded
        if (!user) {
            navigate('/login');
            return;
        }
        if(role){
            navigate('/home');
            return;
        }
        // Wait for role state to be fully determined before making navigation decisions
        if (role === null)
            {
                navigate('/complete-profile');
                return;
            }

    
        if (location.pathname === '/complete-profile' && role) {
            navigate('/home');
            return;
        }
    }, [user, role, loading, navigate, location.pathname]);
    console.log(location.pathname);
    if (loading && location.pathname !== '/login') {
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