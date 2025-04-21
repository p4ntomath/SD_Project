import { db } from "./firebaseConfig"; // adjust the path if needed
import { collection, getDocs } from "firebase/firestore";


/**
 * The function `fetchFunding` retrieves all documents from the Funding collection in Firestore.
 * @returns {Promise<Array>} An array of funding opportunities with their IDs and data.
 */
export const fetchFunding = async () => {
    try {
      const fundingCollection = collection(db, "funding");
      const querySnapshot = await getDocs(fundingCollection);
  
      const fundingList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      return fundingList;
    } catch (error) {
      console.error("Error fetching funding data:", error);
      throw new Error("Failed to fetch funding information");
    }
  };
  