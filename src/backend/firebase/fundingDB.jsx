import { db, auth } from "./firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  getDocs,
  collection,
  Timestamp
} from "firebase/firestore";

/**
 * The function `fetchFunding` retrieves all active funding opportunities from the Funding collection in Firestore.
 * @returns {Promise<Array>} An array of funding opportunities with their IDs and data.
 */
export const fetchFunding = async () => {
  try {
    const fundingCollection = collection(db, "funding");
    // Query to get only active opportunities by default
    const querySnapshot = await getDocs(fundingCollection);

    const fundingList = querySnapshot.docs.map((doc) => ({
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
    })).sort((a, b) => {
      // Sort by status (active first) then by deadline
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return 0;
    });

    return fundingList;
  } catch (error) {
    console.error("Error fetching funding data:", error);
    throw new Error("Failed to fetch funding information");
  }
};



/**
 * Adds new funds to the existing project funds and logs the update in fundingHistory.
 * @param {string} projectId - ID of the project
 * @param {number} additionalFunds - The amount to add to current funds
 * @param {string} source - The source of the funds
 */
export const updateProjectFunds = async (projectId, additionalFunds, source) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
  
      if (typeof additionalFunds !== "number" || additionalFunds < 0) {
        throw new Error("Invalid funds amount");
      }
  
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);
  
      if (!projectSnap.exists()) throw new Error("Project not found");
  
      const projectData = projectSnap.data();
  
      // Check if user is owner or collaborator
      const isOwner = projectData.userId === user.uid;
      const isCollaborator = projectData.collaborators?.some(collab => 
        collab.id === user.uid && collab.permissions?.canAddFunds
      );
  
      if (!isOwner && !isCollaborator) {
        throw new Error("Not authorized to update funding for this project");
      }
  
      const currentAvailableFunds = projectData.availableFunds || 0;
      const updatedAvailableFunds = currentAvailableFunds + additionalFunds;
  
      // Get user's full name from users collection
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userFullName = userSnap.exists() ? userSnap.data().fullName : "Unknown User";
      
      // Update the main document
      await updateDoc(projectRef, { 
        availableFunds: updatedAvailableFunds
      });
  
      // Add funding history entry with additional details
      const historyRef = collection(db, "projects", projectId, "fundingHistory");
      await addDoc(historyRef, {
        amount: additionalFunds,
        totalAfterUpdate: updatedAvailableFunds,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
        updatedByName: userFullName,
        source: source,
        type: "income"  // Changed from 'funding' to 'income'
      });
  
      return { success: true, message: "Funds updated and history logged", updatedFunds: updatedAvailableFunds };
    } catch (error) {
      console.error("Error updating funds:", error);
      throw new Error(error.message);
    }
};


/**
 * Retrieves all funding history entries for a given project.
 * @param {string} projectId - ID of the project
 * @returns {Promise<Array>} - Array of funding history objects
 */
export const getFundingHistory = async (projectId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error("Project not found");

    const projectData = projectSnap.data();
    
    // Check if user is owner or collaborator
    const isOwner = projectData.userId === user.uid;
    const isCollaborator = projectData.collaborators?.some(collab => 
      collab.id === user.uid && collab.permissions?.canAddFunds
    );

    if (!isOwner && !isCollaborator) {
      throw new Error("Not authorized to view this funding history");
    }

    const historyRef = collection(db, "projects", projectId, "fundingHistory");
    const snapshot = await getDocs(historyRef);

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return history;
  } catch (error) {
    console.error("Error fetching funding history:", error);
    throw new Error(error.message);
  }
};

/**
 * Subtracts an amount from the existing project funds and logs the expense in fundingHistory.
 * @param {string} projectId - ID of the project
 * @param {number} expenseAmount - The amount to subtract from current funds
 * @param {string} description - Description of the expense
 */
export const updateProjectExpense = async (projectId, expenseAmount, description) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    if (typeof expenseAmount !== "number" || expenseAmount < 0) {
      throw new Error("Invalid expense amount");
    }
    if (typeof description !== "string" || description.trim() === "") {
      throw new Error("Expense description is required");
    }

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) throw new Error("Project not found");

    const projectData = projectSnap.data();

    // Check if user is owner or collaborator
    const isOwner = projectData.userId === user.uid;
    const isCollaborator = projectData.collaborators?.some(collab => 
      collab.id === user.uid && collab.permissions?.canAddFunds
    );

    if (!isOwner && !isCollaborator) {
      throw new Error("Not authorized to update expenses for this project");
    }

    const currentAvailableFunds = projectData.availableFunds || 0;
    const currentUsedFunds = projectData.usedFunds || 0;

    if (expenseAmount > currentAvailableFunds) {
      throw new Error("Insufficient funds to cover the expense");
    }

    // Get user's full name from users collection
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userFullName = userSnap.exists() ? userSnap.data().fullName : "Unknown User";

    // Update the main document with both available and used funds
    await updateDoc(projectRef, {
      availableFunds: currentAvailableFunds - expenseAmount,
      usedFunds: currentUsedFunds + expenseAmount
    });

    // Add expense history entry with additional details
    const historyRef = collection(db, "projects", projectId, "fundingHistory");
    await addDoc(historyRef, {
      amount: -expenseAmount,
      totalAfterUpdate: currentAvailableFunds - expenseAmount,
      updatedAt: Timestamp.now(),
      updatedBy: user.uid,
      updatedByName: userFullName,
      description: description,
      type: "expense"
    });

    return {
      success: true,
      message: "Expense updated and history logged",
      updatedAvailableFunds: currentAvailableFunds - expenseAmount,
      updatedUsedFunds: currentUsedFunds + expenseAmount
    };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error(error.message);
  }
};

/**
 * Retrieves the current funds for a given project.
 * @param {string} projectId - ID of the project
 * @returns {Promise<number>} - The current funds available for the project
 */
export const getCurrentFunds = async (projectId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error("Project not found");

    const projectData = projectSnap.data();

    // Check if user is owner or collaborator
    const isOwner = projectData.userId === user.uid;
    const isCollaborator = projectData.collaborators?.some(collab => 
      collab.id === user.uid && collab.permissions?.canAddFunds
    );

    if (!isOwner && !isCollaborator) {
      throw new Error("Not authorized to view this project");
    }

    // Return the current funds
    return projectData.availableFunds || 0;
  } catch (error) {
    console.error("Error fetching current funds:", error);
    throw new Error(error.message);
  }
};

/**
 * Retrieves the used funds (expenses) for a given project.
 * @param {string} projectId - ID of the project
 * @returns {Promise<number>} - The total used funds (sum of all expenses)
 */
export const getUsedFunds = async (projectId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error("Project not found");

    const projectData = projectSnap.data();

    // Check if user is owner or collaborator
    const isOwner = projectData.userId === user.uid;
    const isCollaborator = projectData.collaborators?.some(collab => 
      collab.id === user.uid && collab.permissions?.canAddFunds
    );

    if (!isOwner && !isCollaborator) {
      throw new Error("Not authorized to view this project");
    }

    // Get used funds from the funding history (expenses only)
    const historyRef = collection(db, "projects", projectId, "fundingHistory");
    const snapshot = await getDocs(historyRef);
    const usedFunds = snapshot.docs.reduce((total, doc) => {
      const historyData = doc.data();
      if (historyData.amount < 0) { // Only subtracting amounts (expenses)
        total += historyData.amount;
      }
      return total;
    }, 0);

    return Math.abs(usedFunds); // Return absolute value of used funds
  } catch (error) {
    console.error("Error fetching used funds:", error);
    throw new Error(error.message);
  }
};
