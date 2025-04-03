import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ProfileCompletion() {
  const [profession, setProfession] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Predefined options for profession and role
  const professionOptions = [
    "Software Developer",
    "Data Scientist",
    "Designer",
    "Product Manager",
    "Other"
  ];

  const roleOptions = [
    "Junior",
    "Mid-Level",
    "Senior",
    "Manager",
    "Intern"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Update Firestore with additional user details
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        "profileQuestions.profession": profession,
        "profileQuestions.role": role
      });

      // Redirect to homepage after saving
      navigate("/");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("There was an error while saving your profile. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label htmlFor="profession" className="block">Profession</label>
          <select
            id="profession"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select Profession</option>
            {professionOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role" className="block">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select Role</option>
            {roleOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
        >
          Save and Go to Home
        </button>
      </form>
    </div>
  );
}

export default ProfileCompletion;
