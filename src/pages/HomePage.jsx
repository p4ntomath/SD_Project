import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherHome from "./ResearcherPages/ResearcherHome.jsx";
import AuthContext from "../context/AuthContext";
import { ClipLoader } from "react-spinners";

export default function HomePage() {
    const { role, loading, user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    useEffect(() => {
        // Only redirect to complete-profile if we have a user but no role
        if (!loading && user && (role === null || role === undefined)) {
            navigate('/complete-profile');
        } else if (role === 'reviewer' && !loading) {
            navigate('/reviewer/dashboard');
        }
    }, [user, role, loading, navigate]);

    if (role === 'researcher') {
        return <section data-testid="home-page"><ResearcherHome /></section>;
    }
    
    if (loading) {
        return (
            <main className="min-h-screen">
                <section className="flex items-center justify-center min-h-screen" aria-label="Loading">
                    <ClipLoader color="#36d7b7" size={50} aria-label="Loading" />
                </section>
            </main>
        );
    }
    
    return null;
}
