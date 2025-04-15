import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader"; // Assuming you’re using this spinner

const AuthProtectRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const { user, role } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user && role === null) {
            navigate("/complete-profile", { replace: true });
        } else if (user) {
            navigate("/home", { replace: true });
        } else {
            setLoading(false);
        }
    }, [user, role, navigate]);

    if (loading) {
        return (
            <section className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader color="#3498db" size={50} />
            </section>
        );
    }

    return children;
};

export default AuthProtectRoute;
