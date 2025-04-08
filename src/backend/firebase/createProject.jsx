import React, { useState } from 'react';
import { db } from "./firebaseConfig";  
import { addDoc, collection } from 'firebase/firestore';  
function CreateProject() {
  // State hooks for form input values
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [researchField, setResearchField] = useState("");
  const [goals, setGoals] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title || !description || !researchField) {
      setError("Please fill in all the required fields.");
      return;
    }

    try {
      // Storing data in Firestore (handled above)
      const docRef = await addDoc(collection(db, "projects"), {
        title,
        description,
        researchField,
        startDate,
        endDate,
        goals: goals.split(","),
        createdAt: new Date(),
      });

      console.log("Project created with ID:", docRef.id);
      // Clear form fields
      setTitle("");
      setDescription("");
      setResearchField("");
      setGoals("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error("Error creating project:", err);
      setError("An error occurred while creating the project. Please try again.");
    }
  };

  return (
    <div>
      <h2>Create a New Project</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Project Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Research Field</label>
          <input
            type="text"
            value={researchField}
            onChange={(e) => setResearchField(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Goals (comma separated)</label>
          <input
            type="text"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
        </div>
        <div>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
}

export default CreateProject;
