import { db, auth } from "./firebaseConfig";
import { query, where } from "firebase/firestore";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,

} from "firebase/firestore";
import { fetchProjects } from "./projectDB";
import { getFundingHistory } from "./fundingDB";



/*
    * I think from researcher's side(dashboard) get the overall funding
    * Get the completion statuses of each project, name and completion status
    * 
    * 

*/

/**
 * Retrieves funding history for all projects belonging to a user
 * @param {string} uid - The user ID
 * @param {Date} [startDate] - Optional start date to filter funding history
 * @returns {Promise<Array>} Array of projects with their funding histories
 * @throws {Error} If user is not found or data retrieval fails
 */
export const getProjectFunding = async (uid, startDate) => {
  if (!uid) throw new Error("User ID is required");
  try {
    const userProjects = await fetchProjects(uid);
    if (!userProjects?.length) return [];

    const projectsWithFunding = await Promise.all(
      userProjects.map(async (project) => {
        try {
          const fundingHistory = await getFundingHistory(project.id);
          const filteredHistory = startDate
            ? fundingHistory.filter(entry => {
              const entryDate = entry.updatedAt?.toDate?.() ?? new Date(entry.date);
              return entryDate >= startDate;
            })
            : fundingHistory;

          return {
            name: project.title || "Unnamed Project",
            id: project.id,
            fundingHistory: filteredHistory
          };
        } catch (error) {
          console.error(`Error fetching funding for project ${project.id}:`, error);
          return {
            name: project.title || "Unnamed Project",
            id: project.id,
            fundingHistory: []
          };
        }
      })
    );

    return projectsWithFunding.filter(p => p.fundingHistory.length > 0);
  } catch (error) {
    
    throw new Error("Failed to get project funding data");
  }
};



/**
 * Retrieves all folders and their files for all projects belonging to a user
 * @param {string} uid - The user ID
 * @returns {Promise<Array>} Array of projects with their folders and files
 * @throws {Error} If user is not found or data retrieval fails
 */
export const getAllProjectFoldersWithFiles = async (uid) => {
  if (!uid) throw new Error("User ID is required");
  try {
    const projects = await fetchProjects(uid);
    if (!projects?.length) return [];

    const userCache = new Map(); // Cache user lookups to reduce database reads

    const projectFolders = await Promise.all(
      projects.map(async (project) => {
        try {
          const folderSnapshot = await getDocs(
            collection(db, "projects", project.id, "folders")
          );

          if (folderSnapshot.empty) {
            return {
              projectName: project.title || "Unnamed Project",
              projectId: project.id,
              folders: []
            };
          }

          const folders = await Promise.all(
            folderSnapshot.docs.map(async (folderDoc) => {
              try {
                const folderData = folderDoc.data();
                const folderId = folderDoc.id;

                // Fetch files in folder
                const filesSnapshot = await getDocs(
                  collection(db, "projects", project.id, "folders", folderId, "files")
                );

                const files = await Promise.all(
                  filesSnapshot.docs.map(async (fileDoc) => {
                    try {
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
                        fileName: data.fileName || "Unnamed File",
                        uploadedBy: uploadedByName,
                        uploadedAt: data.uploadedAt?.toDate?.() ?? null,
                        size: data.size || 0,
                        type: data.type || "unknown"
                      };
                    } catch (error) {
                      console.error(`Error processing file ${fileDoc.id}:`, error);
                      return null;
                    }
                  })
                );

                return {
                  id: folderId,
                  name: folderData.name || "Unnamed Folder",
                  type: folderData.type || "general",
                  createdAt: folderData.createdAt?.toDate?.() ?? null,
                  files: files.filter(Boolean) // Remove any null entries from errors
                };
              } catch (error) {
                console.error(`Error processing folder ${folderDoc.id}:`, error);
                return null;
              }
            })
          );

          return {
            projectName: project.title || "Unnamed Project",
            projectId: project.id,
            folders: folders.filter(Boolean) // Remove any null entries from errors
          };
        } catch (error) {
          console.error(`Error processing project ${project.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed projects and those with no folders
    return projectFolders
      .filter(Boolean)
      .filter(project => project.folders.length > 0);
  } catch (error) {
    console.error("Error fetching folders and files:", error.message);
    throw new Error("Failed to fetch folders and files for all projects");
  }
};



/**
 * Retrieves all projects reviewed by a specific user with project and researcher details
 * @param {string} uid - The reviewer's user ID
 * @returns {Promise<Array>} Array of reviewed projects with detailed information
 * @throws {Error} If reviewer is not found or data retrieval fails
 */
export const getReviewedProjects = async (uid) => {
  if (!uid) throw new Error("Reviewer ID is required");
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("reviewerId", "==", uid));
    const reviewsSnapshot = await getDocs(q);

    if (reviewsSnapshot.empty) return [];

    const reviewedProjects = [];
    const projectCache = new Map();
    const userCache = new Map();

    for (const reviewDoc of reviewsSnapshot.docs) {
      try {
        const reviewData = reviewDoc.data();
        const projectId = reviewData.projectId;

        if (!projectId) {
          console.warn(`Review ${reviewDoc.id} has no project ID`);
          continue;
        }

        // Get project data using cache
        let projectData;
        if (projectCache.has(projectId)) {
          projectData = projectCache.get(projectId);
        } else {
          const projectSnap = await getDoc(doc(db, "projects", projectId));
          if (!projectSnap.exists()) {
            console.warn(`Project ${projectId} from review ${reviewDoc.id} not found`);
            continue;
          }
          projectData = projectSnap.data();
          projectCache.set(projectId, projectData);
        }

        const { title, description, userId } = projectData;

        // Get researcher data using cache
        let researcherName = "Unknown";
        if (userId) {
          if (userCache.has(userId)) {
            researcherName = userCache.get(userId);
          } else {
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              researcherName = userData.fullName || "Unnamed User";
              userCache.set(userId, researcherName);
            }
          }
        }

        reviewedProjects.push({
          id: reviewDoc.id,
          projectId,
          title: title || "Untitled Project",
          description: description || "No description provided",
          researcherName,
          researcherId: userId,
          feedback: reviewData.feedback || "",
          rating: reviewData.rating,
          status: reviewData.status || "reviewed",
          reviewDate: reviewData.updatedAt?.toDate?.() ?? 
                     reviewData.createdAt?.toDate?.() ?? 
                     new Date(),
          date: reviewData.updatedAt?.toDate?.().toLocaleDateString() ?? "N/A"
        });
      } catch (error) {
        console.error(`Error processing review ${reviewDoc.id}:`, error);
        continue;
      }
    }

    // Sort by review date, most recent first
    return reviewedProjects.sort((a, b) => b.reviewDate - a.reviewDate);
  } catch (error) {
    console.error("Error fetching reviewed projects:", error.message);
    throw new Error("Failed to fetch reviewed projects");
  }
};


// left with admin stuff