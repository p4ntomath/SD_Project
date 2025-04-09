import { db,auth } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';


//this function creates a new project in the Firestore database
export async function createProject(title, description, researchField, goals, startDate, endDate) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    if (!title || !description || !researchField) {
      setError("Please fill in all the required fields.");
      throw new Error("Missing required fields");
    }

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        userId: user.uid,
        title,
        description,
        researchField,
        startDate,
        endDate,
        goals: goals.split(","),
        createdAt: new Date(),
      });

      console.log("Project created with ID:", docRef.id);
    } catch (err) {
      throw err;
    }
}

// fetxhProjects function to get all projects for a specific user
export const fetchProjects = async (uid) => {
  try {
    const projectsCollection = collection(db, "projects");
    const querySnapshot = await getDocs(projectsCollection);
    const projects = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().userId === uid) {
        projects.push({ id: doc.id, ...doc.data() });
      }
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};


export const updateProject = async (id, updatedData) => {
  const projectRef = doc(db, "projects", id);
  await updateDoc(projectRef, updatedData);
};


export const deleteProject = async (id) => {
  const projectRef = doc(db, "projects", id);
  await deleteDoc(projectRef);
};

//Please add update methods for all the fields in the project excluding the userId


