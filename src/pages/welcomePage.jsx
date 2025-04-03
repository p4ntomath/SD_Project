import React, { useEffect, useState } from "react";
import NavBar from "../components/navigationBar.jsx";
import welcomeDisplay from "../assets/welcomeDisplayImage.jpg";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Import the auth object from firebase
import { doc, getDoc } from "firebase/firestore";

export default function WelcomePage() {
  const [user, setUser] = useState(null); // State to store the user object
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Track Firebase loading state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set the user
        try {
          // Fetch additional user data from Firestore
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({ ...currentUser, ...userData }); // Combine Firebase user with Firestore data
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  //   if (loading) {
  //     return <div>Loading...</div>; // You can customize the loading screen as needed
  //   }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-grow flex flex-col md:flex-row items-center justify-center p-4">
        <div className="md:w-1/2 w-full p-4 flex flex-col items-center md:items-start">
          <h1 className="text-4xl font-bold mb-4 text-center md:text-left">
            One platform.
            <br />
            Endless Academic Possibilities
          </h1>
          <p className="text-sm mb-7 text-center md:text-left max-w-md">
            All your research tools, in one brilliant place. Whether you're a
            student, researcher, or academic collaborator, our platform
            simplifies the entire research journey. From project creation and
            milestone tracking to real-time messaging, funding management, and
            document sharing — No more scattered tools or lost files! Everything
            you need is in one place. Stay connected, stay organized, and bring
            your research to life with clarity and confidence.
          </p>
          {loading ? (
            <div>Loading...</div> // You can customize the loading UI as needed (e.g., spinner)
          ) : !user ? (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg md:w-auto"
              onClick={() => navigate("/signup")}
            >
              Sign Up!
            </button>
          ) : (
            <p className="text-sm text-gray-600">Welcome, {user.email}</p> // Display the user's email
          )}
        </div>

        {/* This is to show you how to access the user email and name and details from the database */}
        <div className="p-6 max-w-lg mx-auto">
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <div className="border border-gray-300 p-4 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold">
                Welcome, {user.name || "User"}!
              </h1>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Profession:</strong>{" "}
                {user.profileQuestions?.profession || "Not set"}
              </p>
              <p>
                <strong>Role:</strong>{" "}
                {user.profileQuestions?.role || "Not set"}
              </p>
            </div>
          ) : (
            <p>No user data available.</p>
          )}

          {/*<Logout />*/}
        </div>

        {/* Till here*/}
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
