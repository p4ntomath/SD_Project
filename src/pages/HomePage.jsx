import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherHomePage from './ResearcherHomePage.jsx';
import ResearcherHome from "./ResearcherPages/ResearcherHome.jsx";
import ReviewerHomePage from './ReviewerHomePage.jsx';
import AuthContext from "../context/AuthContext";
import { ClipLoader } from "react-spinners";

export default function HomePage() {
    const { role, loading, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && role == null && loading === false) {
            navigate('/complete-profile');
        }
    }, [user, role, loading, navigate]);

    if (role === 'researcher') {
        return <ResearcherHome />;
    } else if (role === 'reviewer') {
        return <ReviewerHomePage />;
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
