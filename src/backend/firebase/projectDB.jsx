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
      //setError("Please fill in all the required fields.");
      throw new Error("Missing required fields");
    }

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ...newProject,
        userId: user.uid,
      });

      await updateDoc(docRef, {
        projectId: docRef.id,
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

/*export const updateProject = async (id, updatedData) => {
  
  const projectRef = doc(db, "projects", id);
  await updateDoc(projectRef, updatedData);
};
*/

export const updateProject = async (id, updatedData) => {
  try {
    // Get the current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch the project from the Firestore to get the owner
    const projectRef = doc(db, "projects", id);
    const projectSnapshot = await getDoc(projectRef);

    if (!projectSnapshot.exists()) {
      throw new Error('Project not found');
    }

    // Get the userId of the project
    const projectData = projectSnapshot.data();
    const projectUserId = projectData.userId;

    // Check if the current user is the project owner
    if (user.uid !== projectUserId) {
      throw new Error('You are not authorized to update this project');
    }

    // List of restricted fields
    const restrictedFields = ['id', 'userId', 'createdAt'];
    
    // Filter out restricted fields from the updatedData
    const filteredData = Object.keys(updatedData).reduce((acc, key) => {
      if (!restrictedFields.includes(key)) {
        acc[key] = updatedData[key];
      }
      return acc;
    }, {});

    // If no valid data is left after filtering, throw an error
    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields to update.');
    }

    // Update the project in Firestore with the filtered data
    await updateDoc(projectRef, filteredData);

    console.log('Project updated successfully!');
    
  } catch (error) {
    console.error('Error updating project:', error);
  }
};

/**
 * The function `deleteProject` deletes a project document from a Firestore database using its ID.
 */
/*export const deleteProject = async (id) => {
  
  const projectRef = doc(db, "projects", id);
  await deleteDoc(projectRef);
};*/

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
