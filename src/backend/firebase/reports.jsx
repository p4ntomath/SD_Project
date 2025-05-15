import { db, auth } from "./firebaseConfig";
import { query, where } from "firebase/firestore";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { fetchProjects } from "./projectDB";
import { getFundingHistory } from "./fundingDB";
import { getFolders } from "./folderDB";


/*
    * I think from researcher's side(dashboard) get the overall funding
    * Get the completion statuses of each project, name and completion status
    * 
    * 

*/

// Returns Project Name and Funding History, startDate is not a necesity to passed into the function
export const getProjectFunding = async (uid, startDate) => {
  try {
    // Step 1: Fetch user projects
    const userProjects = await fetchProjects(uid);
    //console.log("Stored Projects:", userProjects);

    // Step 2: Fetch funding history for each project
    const projectsWithFunding = await Promise.all(
      userProjects.map(async (project) => {
        const fundingHistory = await getFundingHistory(project.id);

        // Step 3: Filter history if startDate is provided
        const filteredHistory = startDate
          ? fundingHistory.filter(entry => {
            const entryDate = entry.updatedAt?.toDate?.() || new Date(entry.date);
            return entryDate >= startDate;
          })
          : fundingHistory;

        return {
          name: project.title,
          fundingHistory: filteredHistory
        };
      })
    );

    return projectsWithFunding;
  } catch (error) {
    console.error("Error loading projects and funding history:", error);
    throw new Error("Failed to get project funding data");
  }
};

export const getAllProjectFolders = async (uid) => {
  try {
    const projects = await fetchProjects(uid);

    const projectFolders = await Promise.all(
      projects.map(async (project) => {
        const foldersRef = collection(db, "projects", project.id, "folders");
        const folderSnapshot = await getDocs(foldersRef);

        const folders = folderSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return {
          projectName: project.title,
          projectId: project.id,
          folders
        };
      })
    );

    console.log(projectFolders);

    return projectFolders;
  } catch (error) {
    console.error("Error fetching folders for all projects:", error.message);
    throw new Error("Failed to fetch folders for all projects");
  }
};

// Returns the date, project Description, feedback, reseacherName and Title of project
export const getReviewedProjects = async (uid) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("reviewerId", "==", uid));
    const reviewsSnapshot = await getDocs(q);

    const reviewedProjects = [];

    for (const reviewDoc of reviewsSnapshot.docs) {
      console.log("Data: ", reviewsSnapshot);
      const reviewData = reviewDoc.data();
      const projectId = reviewData.projectId;

      // Fetch project info
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) continue;

      const projectData = projectSnap.data();
      const { title, description, userId } = projectData;

      console.log("Data: ", reviewData);

      // Fetch owner name
      let researcherName = "Unknown";
      if (userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          researcherName = userSnap.data().fullName || "Unnamed User";
        }
      }

      reviewedProjects.push({
        title,
        description,
        researcherName,
        feedback: reviewData.feedback || "",
        date: reviewData.updatedAt ? reviewData.updatedAt.toDate().toLocaleDateString() : "N/A"
      });
    }

    return reviewedProjects;
  } catch (error) {
    console.error("Error fetching reviewed projects:", error.message);
    throw new Error("Failed to fetch reviewed projects");
  }
};

// left with admin stuff