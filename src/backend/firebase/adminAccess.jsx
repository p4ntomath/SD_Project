import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Fetches all projects with user fullNames
 * @returns {Promise<Array>} Array of projects with user data
 */
export const fetchProjectsWithUsers = async () => {
  try {
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    const projectsWithUsers = await Promise.all(
      snapshot.docs.map(async (projectDoc) => {
        const projectData = projectDoc.data();
        let userFullName = 'Unknown';
        
        // Fetch user data if userId exists
        if (projectData.userId) {
          const userRef = doc(db, 'users', projectData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            userFullName = userData.fullName || userData.name || 'Unknown';
          }
        }
        
        return {
          id: projectDoc.id,
          title: projectData.title,
          status: projectData.status,
          researchField: projectData.researchField,
          userId: projectData.userId,
          userFullName
        };
      })
    );
    
    return projectsWithUsers;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

/**
 * Fetches all users from Firestore
 * @returns {Promise<Array>} Array of users with required fields
 */
export const fetchAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      return snapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          id: doc.id,
          fullName: userData.fullName || userData.name || 'Unknown',
          role: userData.role || 'No role specified',
          email: userData.email || 'No email'
        };
      });
      
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to load users");
    }
  };

/*
  CRUD methods for the funding opportunities
*/ 
  const fundingCollection = 'funding'; // Your collection name

// CREATE
export const createFunding = async (fundingData) => {
  try {
    const docRef = await addDoc(collection(db, fundingCollection), {
      funding_name: fundingData.name,
      expected_funds: fundingData.expectedFunds,
      external_link: fundingData.externalLink,
      createdAt: new Date()
    });
    return { id: docRef.id, ...fundingData };
  } catch (error) {
    throw new Error(`Error creating funding: ${error.message}`);
  }
};

// READ ALL
export const getAllFunding = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, fundingCollection));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().funding_name,
      expectedFunds: doc.data().expected_funds,
      externalLink: doc.data().external_link
    }));
  } catch (error) {
    throw new Error(`Error fetching funding: ${error.message}`);
  }
};

// UPDATE
export const updateFunding = async (id, fundingData) => {
  try {
    const fundingRef = doc(db, fundingCollection, id);
    await updateDoc(fundingRef, {
      funding_name: fundingData.name,
      expected_funds: fundingData.expectedFunds,
      external_link: fundingData.externalLink,
      updatedAt: new Date()
    });
    return { id, ...fundingData };
  } catch (error) {
    throw new Error(`Error updating funding: ${error.message}`);
  }
};

// DELETE
export const deleteFunding = async (id) => {
  try {
    const fundingRef = doc(db, fundingCollection, id);
    await deleteDoc(fundingRef);
    return id;
  } catch (error) {
    throw new Error(`Error deleting funding: ${error.message}`);
  }
};

/**
 * Fetches all projects from Firestore
 * @returns {Promise<Array>} Array of all projects
 */
export const getAllProjects = async () => {
  try {
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error(`Error fetching projects: ${error.message}`);
  }
};