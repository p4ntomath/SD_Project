import {React,useContext} from "react";
import ResearcherHomePage from './ResearcherHomePage.jsx';
import ReviewerHomePage from './ReviewerHomePage';
import AuthContext from "../context/AuthContext"; // Import the AuthContext


export default function HomePage() {
    const { role } = useContext(AuthContext); // Access the role from AuthContext
    if (role === 'researcher') {
        return <ResearcherHomePage />;
    } else if (role === 'reviewer') {
        return <ReviewerHomePage />;
    } else {
        return <div className="flex h-screen w-full justify-center items-center">
            <h1 className='text-8xl font-bold'>Page Not Found</h1>
            {/* Add any other content you want to display when no role is selected */}
        </div>; // or any other fallback UI
    }
}
    // return (
