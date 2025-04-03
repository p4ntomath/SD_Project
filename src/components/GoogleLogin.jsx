import { auth, provider } from "../firebase";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function GoogleLogin() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User signed in:", result.user);
      navigate("/home"); // Redirect to home on success
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert(error.message); // Notify user of the error
    }
  };

  return (
    <button 
      onClick={handleGoogleLogin} 
      className="bg-yellow-500 text-white px-4 py-2 rounded-md mt-4"
    >
      Sign in with Google
    </button>
  );
}

export default GoogleLogin;