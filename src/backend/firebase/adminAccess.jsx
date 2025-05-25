import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';
import { notify, notifyAdminAction } from './notificationsUtil';

/**
 * Fetches all projects with user fullNames
 * @returns {Promise<Array>} Array of projects with user data
 */
export const fetchProjectsWithUsers = async () => {
  try {
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    // Create a map to store user data and avoid duplicate fetches
    const userDataCache = new Map();
    const userPromises = [];
    const userIds = new Set();

    // First collect all unique user IDs
    snapshot.docs.forEach(projectDoc => {
      const projectData = projectDoc.data();
      if (projectData.userId && !userIds.has(projectData.userId)) {
        userIds.add(projectData.userId);
        const userRef = doc(db, 'users', projectData.userId);
        userPromises.push(getDoc(userRef));
      }
    });

    // Fetch all user data in parallel
    const userSnapshots = await Promise.all(userPromises);
    
    // Cache user data
    userSnapshots.forEach(userSnap => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        userDataCache.set(userSnap.id, userData.fullName || userData.name || 'Unknown');
      }
    });

    // Map projects with cached user data
    const projectsWithUsers = snapshot.docs.map(projectDoc => {
      const projectData = projectDoc.data();
      const userFullName = projectData.userId && userDataCache.has(projectData.userId) 
        ? userDataCache.get(projectData.userId) 
        : 'Unknown';

      return {
        id: projectDoc.id,
        title: projectData.title,
        status: projectData.status,
        researchField: projectData.researchField,
        userId: projectData.userId,
        userFullName
      };
    });
    
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
  const fundingCollection = "funding"; // Your collection name

// CREATE
export const createFunding = async (fundingData) => {
  try {
    const docRef = await addDoc(collection(db, fundingCollection), {
      funding_name: fundingData.funding_name,
      expected_funds: Number(fundingData.expected_funds),
      external_link: fundingData.external_link,
      deadline: fundingData.deadline || '',
      category: fundingData.category || '',
      eligibility: fundingData.eligibility || '',
      description: fundingData.description || '',
      status: fundingData.status || 'active',
      createdAt: Timestamp.now()
    });

    // Get current admin user ID
    const auth = getAuth();
    const adminId = auth.currentUser?.uid;

    // Fetch all users
    const users = await fetchAllUsers();

    // Get all researcher userIds
    const researcherIds = users
      .filter(user => user.role === 'researcher')
      .map(user => user.id);

    // Send notification to each researcher
    await Promise.all(
      researcherIds.map(userId => {
        
        return notifyAdminAction({
          type: 'Funding Opportunity Added',
          FundingName: fundingData.funding_name,
          targetUserId: userId,
          senderUserId: adminId
        });
      })
    );

    // Send notification to admin (self)
    if (adminId) {
      
      await notifyAdminAction({
        type: 'Funding Opportunity Added',
        FundingName: fundingData.funding_name,
        targetUserId: adminId,
        senderUserId: adminId
      });
    }

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
      funding_name: doc.data().funding_name,
      expected_funds: doc.data().expected_funds,
      external_link: doc.data().external_link,
      deadline: doc.data().deadline,
      category: doc.data().category,
      eligibility: doc.data().eligibility,
      description: doc.data().description,
      status: doc.data().status || 'active',
      createdAt: doc.data().createdAt
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
      funding_name: fundingData.funding_name,
      expected_funds: Number(fundingData.expected_funds),
      external_link: fundingData.external_link,
      deadline: fundingData.deadline,
      category: fundingData.category,
      eligibility: fundingData.eligibility,
      description: fundingData.description,
      status: fundingData.status,
      updatedAt: Timestamp.now()
    });

      // Get current admin user ID
    const auth = getAuth();
    const adminId = auth.currentUser?.uid;

    // Fetch all users
    const users = await fetchAllUsers();

    // Get all researcher userIds
    const researcherIds = users
      .filter(user => user.role === 'researcher')
      .map(user => user.id);

    // Send notification to each researcher
    await Promise.all(
      researcherIds.map(userId => {
        
        return notifyAdminAction({
          type: 'Funding Opportunity Updated',
          FundingName: fundingData.funding_name,
          targetUserId: userId,
          senderUserId: adminId
        });
      })
    );

    // Send notification to admin (self)
    if (adminId) {
      
      await notifyAdminAction({
        type: 'Funding Opportunity Updated',
        FundingName: fundingData.funding_name,
        targetUserId: adminId,
        senderUserId: adminId
      });
    }
    return { id, ...fundingData };
  } catch (error) {
    throw new Error(`Error updating funding: ${error.message}`);
  }
};

// DELETE
export const deleteFunding = async (id) => {
  try {
    const fundingRef = doc(db, fundingCollection, id);
    // Fetch the funding document to get its name
    const fundingSnap = await getDoc(fundingRef);
    const fundingData = fundingSnap.exists() ? fundingSnap.data() : {};

    await deleteDoc(fundingRef);

    await notifyAdminAction({
      type: 'Funding Opportunity Deleted',
      FundingName: fundingData.funding_name || 'Unknown Funding',
      targetUserId: getAuth().currentUser?.uid,
      senderUserId: getAuth().currentUser?.uid
    });

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