import React from "react";
import NavBar from "../components/navigationBar.jsx";
import welcomeDisplayImage from "../assets/welcomeDisplay.png";
import '../styling/welcomePage.css';
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    
    <section className="page-container ">

    <aside className="aurora-layers" aria-hidden="true">
      <aside className="aurora aurora-1"></aside>
      <aside className="aurora aurora-2"></aside>
    </aside>
      <aside className="floating-bg-blobs" aria-hidden="true"></aside>
      <NavBar />
      <main className="main-content">
        <article className="flex-layout">
          
        <figure className="blob-container" aria-hidden="true">
          <aside className="floating-blob blob-1"></aside>
          <aside className="floating-blob blob-2"></aside>
        </figure>

          {/* Text Content */}
          <section className="hero-content ">
            <h1 className="heading">
              One platform.
              <br />
              Endless Academic
              <br /> 
              Possibilities
            </h1>
            <p className="tagline">All your research tools, in one brilliant place.</p>
            <p className="description">
              Whether you're a student, researcher, or academic collaborator,
              our platform simplifies the entire research journey. From project
              creation and milestone tracking to real-time messaging, funding
              management, and document sharing — No more scattered tools or lost files!
              Everything you need is in one place. Stay connected, stay organized,
              and bring your research to life with clarity and confidence.
            </p>
            <button
              className="signUp-button"
              onClick={() => navigate("/signup")}
            >
              Sign Up!
            </button>
          </section>
  
          {/* Image */}
          <figure className="image-container">
            <img
              src={welcomeDisplayImage}
              alt="Research collaboration illustration"
              className="max-w-full h-auto"
            />
          </figure>
        </article>
      </main>
    </section>
  );
}
