import React from "react";
import NavBar from '../components/navigationBar.jsx';
import welcomeDisplay from '../assets/welcomeDisplayImage.jpg';
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col">
            <NavBar />
            <div className="flex-grow flex flex-col md:flex-row items-center justify-center p-4">
                <div className="md:w-1/2 w-full p-4 flex flex-col items-center md:items-start">
                    <h1 className="text-4xl font-bold mb-4 text-center md:text-left">
                        One platform.<br />
                        Endless Academic Possibilities
                    </h1>
                    <p className="text-sm mb-7 text-center md:text-left max-w-md">
                        All your research tools, in one brilliant place.
                        Whether you're a student, researcher, or academic collaborator,
                        our platform simplifies the entire research journey. From project
                        creation and milestone tracking to real-time messaging, funding
                        management, and document sharing — No more scattered tools or lost files! 
                        Everything you need is in one place. Stay connected, stay organized, 
                        and bring your research to life with clarity and confidence.
                    </p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg  md:w-auto"  onClick={() => navigate("/signUpPage")}>
                        Sign Up!
                    </button>
                </div>
                <div className="md:w-1/2 hidden md:block p-4">
                    <img 
                        src={welcomeDisplay} 
                        alt="Research collaboration illustration" 
                        className="max-w-full h-auto"
                    />
                </div>
            </div>
        </div>
    );
}