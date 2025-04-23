import { db, auth } from "./firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  Timestamp
} from "firebase/firestore";

/**
 * Adds new funds to the existing project funds and logs the update in fundingHistory.
 * @param {string} projectId - ID of the project
 * @param {number} additionalFunds - The amount to add to current funds
 */
export const updateProjectFunds = async (projectId, additionalFunds) => {
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
  
      if (projectData.userId !== user.uid) {
        throw new Error("Not authorized to update funding for this project");
      }
  
      const currentAvailableFunds = projectData.availableFunds || 0;
      const updatedAvailableFunds = currentAvailableFunds + additionalFunds;
  
      // Update the main document
      await updateDoc(projectRef, { 
        availableFunds: updatedAvailableFunds
      });
  
      // Add funding history entry
      const historyRef = collection(db, "projects", projectId, "fundingHistory");
      await addDoc(historyRef, {
        amount: additionalFunds,
        totalAfterUpdate: updatedAvailableFunds,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
        type: "funding"
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
    if (projectData.userId !== user.uid) {
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
 */
export const updateProjectExpense = async (projectId, expenseAmount) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    if (typeof expenseAmount !== "number" || expenseAmount < 0) {
      throw new Error("Invalid expense amount");
    }

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) throw new Error("Project not found");

    const projectData = projectSnap.data();

    if (projectData.userId !== user.uid) {
      throw new Error("Not authorized to update expenses for this project");
    }

    const currentAvailableFunds = projectData.availableFunds || 0;
    const currentUsedFunds = projectData.usedFunds || 0;

    if (expenseAmount > currentAvailableFunds) {
      throw new Error("Insufficient funds to cover the expense");
    }

    // Update the main document with both available and used funds
    await updateDoc(projectRef, { 
      availableFunds: currentAvailableFunds - expenseAmount,
      usedFunds: currentUsedFunds + expenseAmount
    });

    // Add expense history entry
    const historyRef = collection(db, "projects", projectId, "fundingHistory");
    await addDoc(historyRef, {
      amount: -expenseAmount,
      totalAfterUpdate: currentAvailableFunds - expenseAmount,
      updatedAt: Timestamp.now(),
      updatedBy: user.uid,
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

    if (projectData.userId !== user.uid) {
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

    if (projectData.userId !== user.uid) {
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
