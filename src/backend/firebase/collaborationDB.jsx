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
    arrayRemove,
} from "firebase/firestore";

/**
 * Adds a collaborator to a project with default "Viewer" access.
 * @param {string} projectId - The ID of the project.
 * @param {string} collaboratorId - The ID of the collaborator to add.
 * @returns {Promise<void>}
 */
export const addCollaboratorToProject = async (projectId, collaboratorId) => {
    try {
        const projectRef = doc(db, "projects", projectId);

        const collaboratorData = {
            id: collaboratorId,
            accessLevel: "Viewer",
        };

        await updateDoc(projectRef, {
            collaborators: arrayUnion(collaboratorData),
        });

        console.log("Collaborator with access level added successfully");
    } catch (error) {
        console.error("Error adding collaborator:", error.message, error.stack);
        throw new Error("Failed to add collaborator");
    }
};

/**
 * Updates the access level of a collaborator in a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} collaboratorId - The ID of the collaborator.
 * @param {string} [newAccessLevel="FullControlEditor"] - The new access level to assign.
 * @returns {Promise<void>}
 */
export const updateCollaboratorAccessLevel = async (projectId, collaboratorId, newAccessLevel = "FullControlEditor") => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project does not exist");
        }

        const projectData = projectSnap.data();
        const currentCollaborators = projectData.collaborators || [];

        const updatedCollaborators = currentCollaborators.map(collab =>
            collab.id === collaboratorId ? { ...collab, accessLevel: newAccessLevel } : collab
        );

        await updateDoc(projectRef, {
            collaborators: updatedCollaborators
        });

        console.log("Collaborator access level updated successfully");
    } catch (error) {
        console.error("Error updating collaborator access level:", error.message, error.stack);
        throw new Error("Failed to update collaborator access level");
    }
};

/**
 * Removes a collaborator from a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} collaboratorId - The ID of the collaborator to remove.
 * @returns {Promise<void>}
 */
export const removeCollaboratorFromProject = async (projectId, collaboratorId) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const projectData = projectSnap.data();

        const collaboratorToRemove = projectData.collaborators.find(
            (collab) => collab.id === collaboratorId
        );

        if (!collaboratorToRemove) {
            throw new Error("Collaborator not found in project");
        }

        await updateDoc(projectRef, {
            collaborators: arrayRemove(collaboratorToRemove),
        });

        console.log("Collaborator removed successfully");
    } catch (error) {
        console.error("Error removing collaborator:", error.message, error.stack);
        throw new Error("Failed to remove collaborator");
    }
};

/**
 * Suggests researchers based on keyword similarity to the current user's profile.
 *
 * @param {Object} currentUser - Current user's full profile object.
 * @param {Array} allResearchers - List of researcher objects to compare.
 * @returns {Array} - Sorted list of suggested researchers with high profile similarity.
 */
const suggestResearchers = (currentUser, allResearchers) => {
    const keywords = [
        ...(currentUser.institution?.toLowerCase().split(" ") || []),
        ...(currentUser.biography?.toLowerCase().split(" ") || []),
        ...(currentUser.researchInterests?.map(kw => kw.toLowerCase()) || [])
    ];

    const scoreMatch = (researcher) => {
        const compareText = [
            researcher.institution?.toLowerCase(),
            researcher.biography?.toLowerCase(),
            ...(researcher.researchInterests?.map(kw => kw.toLowerCase()) || [])
        ].join(" ");

        const matches = keywords.filter(keyword => compareText.includes(keyword));
        return matches.length;
    };

    return allResearchers
        .map(researcher => ({ ...researcher, score: scoreMatch(researcher) }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score); // Sort descending by match score
};

/**
 * Searches for researchers by name or institution/department.
 * If searchTerm is empty, shows suggested researchers based on profile similarity.
 *
 * @param {string} searchTerm - Search input from user.
 * @param {string} currentUserId - ID of the currently logged-in user.
 * @param {Object} project - Project object containing projectId and collaborators.
 * @returns {Promise<Array>} - Filtered or suggested researcher profiles.
 */
export const searchResearchers = async (searchTerm, currentUserId, project) => {
    try {
        const usersCollection = collection(db, "users");

        const researcherQuery = query(
            usersCollection,
            where("role", "==", "researcher")
        );
        const querySnapshot = await getDocs(researcherQuery);

        const invitationsQuery = query(
            collection(db, "invitations"),
            where("projectId", "==", project.projectId),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const invitedResearcherIds = invitationsSnapshot.docs.map(doc => doc.data().researcherId);

        const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
        const currentUser = currentUserDoc.data();

        const allResearchers = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((researcher) =>
                researcher.id !== currentUserId &&
                !project.collaborators?.includes(researcher.id) &&
                !invitedResearcherIds.includes(researcher.id)
            );

        if (searchTerm.trim() === "") {
            return suggestResearchers(currentUser, allResearchers);
        }

        const lowerSearchTerm = searchTerm.toLowerCase();

        return allResearchers.filter((researcher) => {
            const nameMatches = researcher.fullName?.toLowerCase().includes(lowerSearchTerm);
            const institutionMatches = researcher.institution?.toLowerCase().includes(lowerSearchTerm);
            return nameMatches || institutionMatches;
        });
    } catch (error) {
        console.error("Error searching for researchers:", error);
        throw new Error("Failed to search for researchers");
    }
};


/**
 * Sends an invitation to a researcher for a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} researcherId - The ID of the researcher to invite.
 * @param {string} senderId - The ID of the user sending the invitation.
 * @returns {Promise<Object>} - Result object with success status and message.
 */
export const sendResearcherInvitation = async (projectId, researcherId, senderId) => {
    try {
        const invitationRef = collection(db, "invitations");
        await addDoc(invitationRef, {
            projectId,
            researcherId,
            senderId,
            status: "pending",
            type: "researcher",
            createdAt: serverTimestamp(),
        });
        return { success: true, message: "Invitation sent successfully" };
    } catch (error) {
        console.error("Error sending researcher invitation:", error.message, error.stack);
        throw new Error("Failed to send researcher invitation");
    }
};

/**
 * Handles a researcher’s response to an invitation.
 * @param {string} invitationId - The ID of the invitation document.
 * @param {boolean} accepted - Whether the invitation was accepted or declined.
 * @returns {Promise<Object>} - Result object with success status and message.
 */
export const respondToResearcherInvitation = async (invitationId, accepted) => {
    try {
        const invitationRef = doc(db, "invitations", invitationId);
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
            throw new Error("Invitation not found");
        }

        const invitation = invitationSnap.data();
        const { projectId, researcherId } = invitation;

        if (accepted) {
            await addResearcherToProject(projectId, researcherId);
            await updateDoc(invitationRef, {
                status: "accepted",
                updatedAt: serverTimestamp()
            });
        } else {
            await updateDoc(invitationRef, {
                status: "declined",
                updatedAt: serverTimestamp()
            });
        }

        return { success: true, message: `Invitation ${accepted ? "accepted" : "declined"} successfully` };
    } catch (error) {
        console.error("Error responding to researcher invitation:", error.message);
        throw new Error("Failed to respond to researcher invitation");
    }
};

/*export const assignTaskToCollaborator = async (projectId, collaboratorId, taskText) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const task = { text: taskText, completed: false };

        // Use Firestore dot notation for nested fields
        await updateDoc(projectRef, {
            [`collaboratorTasks.${collaboratorId}`]: arrayUnion(task),
        });

        console.log("Task assigned successfully");
    } catch (error) {
        console.error("Error assigning task:", error.message);
        throw new Error("Failed to assign task");
    }
};

export const markTaskCompleted = async (projectId, collaboratorId, taskText) => {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
        const tasks = projectSnap.data()?.collaboratorTasks?.[collaboratorId] || [];
        const updatedTasks = tasks.map(task =>
            task.text === taskText ? { ...task, completed: true } : task
        );

        await updateDoc(projectRef, {
            [`collaboratorTasks.${collaboratorId}`]: updatedTasks
        });

        console.log("Task marked as completed");
    } else {
        throw new Error("Project not found");
    }
};

export const editCollaboratorTask = async (projectId, collaboratorId, taskIndex, updatedTask) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const data = projectSnap.data();
        const tasks = data.collaboratorTasks?.[collaboratorId];

        if (!tasks || !Array.isArray(tasks) || taskIndex >= tasks.length) {
            throw new Error("Invalid collaborator or task index");
        }

        // Replace the specific task with the updated task
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...updatedTask, // allows updating just `text`, or `completed`, or both
        };

        await updateDoc(projectRef, {
            [`collaboratorTasks.${collaboratorId}`]: tasks
        });

        return { success: true, message: "Task updated successfully" };
    } catch (error) {
        console.error("Error editing collaborator task:", error.message);
        throw new Error("Failed to edit task");
    }
};

export const deleteCollaboratorTask = async (projectId, collaboratorId, taskIndex) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const data = projectSnap.data();
        const tasks = data.collaboratorTasks?.[collaboratorId];

        if (!tasks || taskIndex < 0 || taskIndex >= tasks.length) {
            throw new Error("Invalid task index or collaborator");
        }

        // Remove task at the given index
        tasks.splice(taskIndex, 1);

        await updateDoc(projectRef, {
            [`collaboratorTasks.${collaboratorId}`]: tasks,
        });

        return { success: true, message: "Task deleted successfully" };
    } catch (error) {
        console.error("Error deleting task:", error.message);
        throw new Error("Failed to delete task");
    }
};

// Get tasks for a specific collaborator in a project
export const getTasksForCollaborator = async (projectId, collaboratorId) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const data = projectSnap.data();
        const tasks = data.collaboratorTasks?.[collaboratorId] || [];

        return tasks;
    } catch (error) {
        console.error("Error fetching tasks:", error.message);
        throw new Error("Failed to get tasks");
    }
};

export const getAllCollaboratorTaskSummaries = async (projectId) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const data = projectSnap.data();
        const collaboratorTasks = data.collaboratorTasks || {};
        const collaboratorIds = Object.keys(collaboratorTasks);

        if (collaboratorIds.length === 0) return [];

        // Fetch collaborator user info
        const usersCollection = collection(db, "users");
        const userMap = {};
        // Split collaboratorIds into chunks of 10
        const chunkSize = 10;
        const chunkedQueries = [];
        for (let i = 0; i < collaboratorIds.length; i += chunkSize) {
            const chunk = collaboratorIds.slice(i, i + chunkSize);
            const userQuery = query(usersCollection, where("__name__", "in", chunk));
            chunkedQueries.push(getDocs(userQuery));
        }

        const queryResults = await Promise.all(chunkedQueries);
        queryResults.forEach((userSnapshot) => {
            userSnapshot.forEach((doc) => {
                userMap[doc.id] = doc.data().fullName || "Unnamed";
            });
        });

        // Format result
        const results = collaboratorIds.map((collaboratorId) => {
            const tasks = collaboratorTasks[collaboratorId];
            const total = tasks.length;
            const completed = tasks.filter(task => task.completed).length;

            return {
                collaboratorId,
                fullName: userMap[collaboratorId] || "Unknown",
                tasks,
                completionStatus: `${completed}/${total} completed`,
            };
        });

        return results;
    } catch (error) {
        console.error("Error getting collaborator task summaries:", error.message);
        throw new Error("Failed to get task summaries");
    }
};*/