/**
 * The code includes functions to create, fetch, update, and delete projects in a Firestore database
 * for a specific user.
 */
import { db, auth } from "./firebaseConfig";
import { query, where, arrayUnion, serverTimestamp } from "firebase/firestore";
import {
  collection,
  setDoc,
  getDocs,
  getDoc,
  addDoc,
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
  console.log("Creating project:", newProject);
  const { title, description, researchField, deadline } = newProject;
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  if (!title || !description || !researchField || !deadline) {
    throw new Error("Missing required fields");
  }

  try {
    const projectsRef = collection(db, "projects");
    const newDocRef = doc(projectsRef);
    const docId = newDocRef.id;

    // Calculate duration based on creation date and deadline
    const creationDate = serverTimestamp();
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const durationMs = deadlineDate.getTime() - currentDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    let duration;
    
    if (durationDays >= 365) {
      const years = Math.floor(durationDays / 365);
      duration = `${years} year${years > 1 ? 's' : ''}`;
    } else if (durationDays >= 30) {
      const months = Math.floor(durationDays / 30);
      duration = `${months} month${months > 1 ? 's' : ''}`;
    } else {
      duration = `${durationDays} day${durationDays > 1 ? 's' : ''}`;
    }

    // Create a clean project object with properly formatted data
    const projectWithId = {
      ...newProject,
      createdAt: creationDate,
      updatedAt: creationDate,
      deadline: deadlineDate,
      duration: duration,
      userId: user.uid,
      projectId: docId,
      availableFunds: newProject.availableFunds || 0,
      usedFunds: newProject.usedFunds || 0,
      status: newProject.status || 'In Progress',
      goals: Array.isArray(newProject.goals) ? newProject.goals.map(goal => ({
        text: goal.text || goal,
        completed: Boolean(goal.completed || false)
      })) : []
    };

    await setDoc(newDocRef, projectWithId);
    return docId;
  } catch (err) {
    console.error("Error creating project:", err);
    throw new Error(`Failed to create project: ${err.message}`);
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
    
    // First get projects where user is owner
    const ownedProjectsQuery = query(projectsCollection, where("userId", "==", uid));
    const ownedProjectsSnapshot = await getDocs(ownedProjectsQuery);
  

    // Get all projects and filter for collaborations
    const allProjectsSnapshot = await getDocs(projectsCollection);
    const collabProjects = allProjectsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.collaborators?.some(collab => collab.id === uid);
    });
    


    // Combine both sets of projects
    const projects = [...ownedProjectsSnapshot.docs, ...collabProjects]
      .reduce((acc, doc) => {
        if (!acc.some(p => p.id === doc.id)) {
          acc.push({
            id: doc.id,
            ...doc.data()
          });
        }
        return acc;
      }, []);

    
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }
};

/**
 * Fetches a single project by its ID from Firestore
 * @param {string} projectId - The ID of the project to fetch
 * @returns {Promise<Object>} The project data with its ID
 * @throws {Error} If the project is not found or user is not authenticated
 */
export const fetchProject = async (projectId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectSnap.data();
    
    // Check if user has access (is owner, reviewer, or collaborator)
    const isOwner = projectData.userId === user.uid;
    const isInReviewersArray = projectData.reviewers?.some(rev => rev.id === user.uid);
    const isCollaborator = projectData.collaborators?.some(collab => collab.id === user.uid);

    // Check reviewRequests collection for an accepted request
    const requestQuery = query(
      collection(db, "reviewRequests"),
      where("projectId", "==", projectId),
      where("reviewerId", "==", user.uid),
      where("status", "==", "accepted")
    );
    const requestSnap = await getDocs(requestQuery);
    const isAcceptedReviewer = !requestSnap.empty;

    if (!isOwner && !isInReviewersArray && !isAcceptedReviewer && !isCollaborator) {
      throw new Error('You do not have permission to access this project');
    }

    // Handle timestamp conversions
    if (typeof projectData.createdAt === 'string') {
      projectData.createdAt = {
        seconds: Math.floor(new Date(projectData.createdAt).getTime() / 1000),
        nanoseconds: 0
      };
    }
    
    if (typeof projectData.deadline === 'string') {
      projectData.deadline = {
        seconds: Math.floor(new Date(projectData.deadline).getTime() / 1000),
        nanoseconds: 0
      };
    }

    if (typeof projectData.updatedAt === 'string') {
      projectData.updatedAt = {
        seconds: Math.floor(new Date(projectData.updatedAt).getTime() / 1000),
        nanoseconds: 0
      };
    }

    // Add the review request to the project data if it exists
    if (!isOwner && (isInReviewersArray || isAcceptedReviewer)) {
      if (!requestSnap.empty) {
        projectData.reviewRequest = {
          id: requestSnap.docs[0].id,
          ...requestSnap.docs[0].data()
        };
      }
    }

    return {
      id: projectSnap.id,
      ...projectData
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
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

    const restrictedFields = ['id', 'userId', 'createdAt', 'projectId'];
    const filteredData = Object.keys(updatedData).reduce((acc, key) => {
      if (!restrictedFields.includes(key)) {
        acc[key] = updatedData[key];
      }
      return acc;
    }, {});

    // Handle deadline conversion, validation and duration calculation
    if (filteredData.deadline) {
      let deadlineDate;
      try {
        deadlineDate = new Date(filteredData.deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new Error("Invalid deadline date");
        }
        
        // Recalculate duration based on creation date and new deadline
        const creationDate = projectData.createdAt.toDate ? projectData.createdAt.toDate() : new Date(projectData.createdAt);
        const durationMs = deadlineDate.getTime() - creationDate.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        
        if (durationDays >= 365) {
          const years = Math.floor(durationDays / 365);
          filteredData.duration = `${years} year${years > 1 ? 's' : ''}`;
        } else if (durationDays >= 30) {
          const months = Math.floor(durationDays / 30);
          filteredData.duration = `${months} month${months > 1 ? 's' : ''}`;
        } else {
          filteredData.duration = `${durationDays} day${durationDays > 1 ? 's' : ''}`;
        }
        
        // Update the deadline
        filteredData.deadline = deadlineDate;
      } catch (error) {
        throw new Error(`Invalid deadline format: ${error.message}`);
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return;
    }

    // Add update timestamp
    filteredData.updatedAt = new Date();

    await updateDoc(projectRef, filteredData);
    return { success: true, message: 'Project updated successfully' };
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
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
  // eslint-disable-next-line no-useless-catch
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to delete projects');

    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectSnap.data();
    if (projectData.userId !== user.uid) {
      throw new Error('You are not authorized to delete this project');
    }

    // First delete all funding history documents
    const historyRef = collection(db, "projects", projectId, "fundingHistory");
    const historySnapshot = await getDocs(historyRef);
    
    // Delete each history document
    const deletePromises = historySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Then delete the project document
    await deleteDoc(projectRef);
    
    return { success: true, message: 'Project and funding history deleted successfully' };
  } catch (error) {
    throw error;
  }
};

//Please add update methods for all the fields in the project excluding the userId

export const assignReviewers = async (projectId, reviewerRequests) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    // Add unique IDs to reviewer requests
    const requestsWithIds = reviewerRequests.map(request => ({
      ...request,
      id: crypto.randomUUID()
    }));

    // Update project with reviewer requests
    await updateDoc(projectRef, {
      reviewerRequests: arrayUnion(...requestsWithIds),
      updatedAt: serverTimestamp()
    });

    return requestsWithIds;
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    throw error;
  }
};

// Function to get review requests for a reviewer
export const getReviewRequests = async (reviewerId) => {
  try {
    // Query all projects that have review requests for this reviewer
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef);
    const querySnapshot = await getDocs(q);
    
    const requests = [];
    
    querySnapshot.forEach((doc) => {
      const project = doc.data();
      if (project.reviewerRequests) {
        const reviewerRequests = project.reviewerRequests.filter(
          req => req.reviewerId === reviewerId
        );
        requests.push(...reviewerRequests.map(req => ({
          ...req,
          projectId: doc.id
        })));
      }
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting review requests:', error);
    throw error;
  }
};

// Function to update a reviewer request status
export const updateReviewerRequest = async (projectId, requestId, status) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = projectDoc.data();
    const updatedRequests = project.reviewerRequests.map(req => 
      req.id === requestId ? { ...req, status } : req
    );

    // If request was accepted, also add reviewer to the project's reviewers array
    if (status === 'accepted') {
      const acceptedRequest = project.reviewerRequests.find(req => req.id === requestId);
      const reviewer = {
        id: acceptedRequest.reviewerId,
        name: acceptedRequest.reviewerName
      };

      await updateDoc(projectRef, {
        reviewerRequests: updatedRequests,
        reviewers: arrayUnion(reviewer),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(projectRef, {
        reviewerRequests: updatedRequests,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating reviewer request:', error);
    throw error;
  }
};

// Get project details
export const getProjectDetails = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectSnap.data();

    // Get project owner's details
    const ownerRef = doc(db, "users", projectData.userId);
    const ownerSnap = await getDoc(ownerRef);
    if (ownerSnap.exists()) {
      const ownerData = ownerSnap.data();
      projectData.researcherName = ownerData.fullName || 'Unknown';
    }

    return {
      id: projectSnap.id,
      ...projectData
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

