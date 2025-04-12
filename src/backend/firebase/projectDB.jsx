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
  getDoc,
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

//fetch projects by projectid
export const fetchProjectById = async (projectId) => {
  try {
    const projectDoc = doc(db, "projects", projectId);  // Fetching a single document by ID
    const projectSnapshot = await getDoc(projectDoc);

    if (projectSnapshot.exists()) {
      return { id: projectSnapshot.id, ...projectSnapshot.data() };
    } else {
      throw new Error("Project not found");
    }
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw new Error("Failed to fetch project details");
  }
};

//add collaborator to project
export const addCollaboratorToProject = async (projectId, collaboratorId) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      collaborators: arrayUnion(collaboratorId),  // Use Firestore's arrayUnion to add the collaborator without duplicating
    });
    console.log("Collaborator added successfully");
  } catch (error) {
    console.error("Error adding collaborator:", error);
    throw new Error("Failed to add collaborator");
  }
};

export const searchResearchers = async (searchTerm) => {
  try {
    const usersCollection = collection(db, "users");

    // First, get all researchers
    const researcherQuery = query(usersCollection, where("role", "==", "researcher"));
    const querySnapshot = await getDocs(researcherQuery);

    // Filter locally based on first name
    const researchers = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((researcher) =>
        researcher.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
        //Filter by name is not complete, also includes current_user name too
      );
    return researchers;
  } catch (error) {
    console.error("Error searching for researchers:", error);
    throw new Error("Failed to search for researchers");
  }
};