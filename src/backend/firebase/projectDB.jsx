/**
 * The code includes functions to create, fetch, update, and delete projects in a Firestore database
 * for a specific user.
 */
import { db,auth } from "./firebaseConfig";
import { query, where } from "firebase/firestore";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';


//this function creates a new project in the Firestore database
/**
 * The function `createProject` in JavaScript React creates a new project with specified details after
 * checking user authentication and required fields.
 */
export async function createProject(newProject) {
    const { title, description, researchField } = newProject;
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
        ...newProject,
        userId: user.uid,
      });
      return docRef.id;
    } catch (err) {
      throw err;
    }
}

// fetxhProjects function to get all projects for a specific user
/**
 * The function `fetchProjects` retrieves projects associated with a specific user ID from a Firestore
 * collection.
 * @returns The `fetchProjects` function returns an array of projects that belong to a specific user
 * identified by their `uid`. Each project object in the array contains an `id` field representing the
 * document ID in the database, along with other data retrieved from the document.
 */
export const fetchProjects = async (uid) => {
  try {
    const projectsCollection = collection(db, "projects");
    const userProjectsQuery = query(projectsCollection, where("userId", "==", uid));
    const querySnapshot = await getDocs(userProjectsQuery);

    const projects = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }
};

/**
 * The `updateProject` function updates a project in a Firestore database using the provided `id` and
 * `updatedData`.
 */
export const updateProject = async (id, updatedData) => {
  const projectRef = doc(db, "projects", id);
  await updateDoc(projectRef, updatedData);
};


/**
 * The function `deleteProject` deletes a project document from a Firestore database using its ID.
 */
export const deleteProject = async (id) => {
  const projectRef = doc(db, "projects", id);
  await deleteDoc(projectRef);
};

//Please add update methods for all the fields in the project excluding the userId
