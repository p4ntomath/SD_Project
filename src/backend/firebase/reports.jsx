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
    const userProjects = await fetchProjects(uid);

    const projectsWithFunding = await Promise.all(
      userProjects.map(async (project) => {
        const fundingHistory = await getFundingHistory(project.id);

        const filteredHistory = startDate
          ? fundingHistory.filter(entry => {
            const entryDate = entry.updatedAt?.toDate?.() ?? new Date(entry.date);
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


export const getAllProjectFoldersWithFiles = async (uid) => {
  try {
    const projects = await fetchProjects(uid);
    const userCache = new Map(); // Cache user lookups

    const projectFolders = await Promise.all(
      projects.map(async (project) => {
        const folderSnapshot = await getDocs(
          collection(db, "projects", project.id, "folders")
        );

        const folders = await Promise.all(
          folderSnapshot.docs.map(async (folderDoc) => {
            const folderData = folderDoc.data();
            const folderId = folderDoc.id;

            // Fetch files in folder
            const filesSnapshot = await getDocs(
              collection(db, "projects", project.id, "folders", folderId, "files")
            );

            const files = await Promise.all(
              filesSnapshot.docs.map(async (fileDoc) => {
                const data = fileDoc.data();
                const uploadedById = data.uploadedBy;

                let uploadedByName = "Unknown";

                if (uploadedById) {
                  if (userCache.has(uploadedById)) {
                    uploadedByName = userCache.get(uploadedById);
                  } else {
                    const userSnap = await getDoc(doc(db, "users", uploadedById));
                    if (userSnap.exists()) {
                      const userData = userSnap.data();
                      uploadedByName = userData.fullName || "Unnamed User";
                      userCache.set(uploadedById, uploadedByName);
                    }
                  }
                }

                return {
                  fileId: fileDoc.id,
                  fileName: data.fileName,
                  uploadedBy: uploadedByName,
                  uploadedAt: data.uploadedAt?.toDate?.() ?? null,
                };
              })
            );

            return {
              id: folderId,
              name: folderData.name ?? "",
              type: folderData.type ?? "",
              files,
            };
          })
        );

        return {
          projectName: project.title,
          projectId: project.id,
          folders,
        };
      })
    );

    return projectFolders;
  } catch (error) {
    console.error("Error fetching folders and files:", error.message);
    throw new Error("Failed to fetch folders and files for all projects");
  }
};



// Returns the date, project Description, feedback, reseacherName and Title of project
export const getReviewedProjects = async (uid) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("reviewerId", "==", uid));
    const reviewsSnapshot = await getDocs(q);

    const reviewedProjects = [];

    // Cache to avoid duplicate reads
    const projectCache = new Map();
    const userCache = new Map();

    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data();
      const projectId = reviewData.projectId;

      if (!projectId) continue;

      // Use cache to avoid redundant reads
      let projectData = projectCache.get(projectId);
      if (!projectData) {
        const projectSnap = await getDoc(doc(db, "projects", projectId));
        if (!projectSnap.exists()) continue;
        projectData = projectSnap.data();
        projectCache.set(projectId, projectData);
      }

      const { title, description, userId } = projectData;

      // Fetch researcher info (cached)
      let researcherName = "Unknown";
      if (userId) {
        let userData = userCache.get(userId);
        if (!userData) {
          const userSnap = await getDoc(doc(db, "users", userId));
          if (userSnap.exists()) {
            userData = userSnap.data();
            userCache.set(userId, userData);
          }
        }
        researcherName = userData?.fullName || "Unnamed User";
      }

      reviewedProjects.push({
        title,
        description,
        researcherName,
        feedback: reviewData.feedback || "",
        date: reviewData.updatedAt?.toDate?.().toLocaleDateString() ?? "N/A"
      });
    }

    return reviewedProjects;
  } catch (error) {
    console.error("Error fetching reviewed projects:", error.message);
    throw new Error("Failed to fetch reviewed projects");
  }
};


// left with admin stuff