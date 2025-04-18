/**
 * The code includes functions to create, fetch, update, and delete projects in a Firestore database
 * for a specific user.
 */
import { db,auth } from "./firebaseConfig";
import { query, where } from "firebase/firestore";
import {
  collection,
  setDoc,
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
      //setError("Please fill in all the required fields.");
      throw new Error("Missing required fields");
    }

    try {
      const projectsRef = collection(db, "projects");
      const newDocRef = doc(projectsRef); // generates a new doc ref with ID

      const projectWithId = {
      ...newProject,
      userId: user.uid,
      projectId: newDocRef.id,
    };
    await setDoc(newDocRef, projectWithId);

    return newDocRef.id;
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
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const projectRef = doc(db, "projects", id);
    const projectSnapshot = await getDoc(projectRef);

    if (!projectSnapshot.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectSnapshot.data();
    const projectUserId = projectData.userId;

    if (user.uid !== projectUserId) {
      throw new Error('You are not authorized to update this project');
    }

    const restrictedFields = ['id', 'userId', 'createdAt'];
    const filteredData = Object.keys(updatedData).reduce((acc, key) => {
      if (!restrictedFields.includes(key)) {
        acc[key] = updatedData[key];
      }
      return acc;
    }, {});

    if (Object.keys(filteredData).length === 0) {
      return;
    }

    await updateDoc(projectRef, filteredData);
    return { success: true, message: 'Project updated successfully' };
  } catch (error) {
    throw error; //
  }
};


/**
 * The function `deleteProject` deletes a project document from a Firestore database using its ID.
 */
/*export const deleteProject = async (id) => {
  
/**
 * The function `deleteProject` deletes a project document from a Firestore database using its ID.
 */

export const deleteProject = async (projectId) => {
  try {
    
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to delete projects');

    // 2. Get Project Reference
    const projectRef = doc(db, "projects", projectId);

    // 3. Verify Project Exists and Get Owner
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error('Project does not exist');

    const projectOwnerId = projectSnap.data().userId;

    if (user.uid !== projectOwnerId) {
      throw new Error('You can only delete your own projects');
    }


    await deleteDoc(projectRef);

    return { success: true, message: 'Project deleted successfully' };

  } catch (error) {
    console.error('Delete project error:', error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
};

//Please add update methods for all the fields in the project excluding the userId  
