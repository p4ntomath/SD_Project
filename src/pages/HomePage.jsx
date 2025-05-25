/**
 * @fileoverview Main home page router that directs users to role-specific dashboards
 * @description Central routing component that determines which dashboard to show based on user role
 */

import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResearcherHome from "./ResearcherPages/ResearcherHome.jsx";
import AuthContext from "../context/AuthContext";
import { ClipLoader } from "react-spinners";

/**
 * HomePage component that routes users to appropriate dashboards based on their role
 * @returns {JSX.Element|null} Role-specific dashboard component or loading spinner
 */
export default function HomePage() {
    const { role, loading, user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    /**
     * Handle navigation based on user authentication status and role
     * Redirects users to appropriate pages based on their current state
     */
    useEffect(() => {
        // Only redirect to complete-profile if we have a user but no role
        if (!loading && user && (role === null || role === undefined)) {
            navigate('/complete-profile');
        } else if (role === 'reviewer' && !loading) {
            navigate('/reviewer/dashboard');
        }
    }, [user, role, loading, navigate]);

    // Show researcher dashboard for researcher role
    if (role === 'researcher') {
        return <section data-testid="home-page"><ResearcherHome /></section>;
    }
    
    // Show loading spinner while authentication state is being determined
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
