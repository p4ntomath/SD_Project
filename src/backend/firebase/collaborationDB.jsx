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

//add collaborator to project
export const addCollaboratorToProject = async (projectId, collaboratorId) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            collaborators: arrayUnion(collaboratorId), // Use Firestore's arrayUnion to add the collaborator without duplicating
        });
        console.log("Collaborator added successfully");
    } catch (error) {
        console.error("Error adding collaborator:", error.message, error.stack);
        throw new Error("Failed to add collaborator");
    }
};

// Remove collaborator (researcher) from project
export const removeCollaboratorFromProject = async (projectId, collaboratorId) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            collaborators: arrayRemove(collaboratorId), // Removes the collaborator if present
        });
        console.log("Collaborator removed successfully");
    } catch (error) {
        console.error("Error removing collaborator:", error.message, error.stack);
        throw new Error("Failed to remove collaborator");
    }
};

export const searchResearchers = async (searchTerm, currentUserId, project) => {
    try {
        const usersCollection = collection(db, "users");

        // Query all users with role "researcher"
        const researcherQuery = query(
            usersCollection,
            where("role", "==", "researcher")
        );
        const querySnapshot = await getDocs(researcherQuery);

        // Query all invitations for this project and type "researcher"
        const invitationsQuery = query(
            collection(db, "invitations"),
            where("projectId", "==", project.projectId),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const invitedResearcherIds = invitationsSnapshot.docs.map(doc => doc.data().researcherId);

        // Filter based on search, excluding current user, existing collaborators, and invited researchers
        const researchers = querySnapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter((researcher) => {
                const nameMatches = researcher.fullName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const isCurrentUser = researcher.id === currentUserId;
                const isCollaborator = project.collaborators?.includes(researcher.id);
                const isAlreadyInvited = invitedResearcherIds.includes(researcher.id);

                return nameMatches && !isCurrentUser && !isCollaborator && !isAlreadyInvited;
            });

        return researchers;
    } catch (error) {
        console.error("Error searching for researchers:", error);
        throw new Error("Failed to search for researchers");
    }
};


// Send researcher invitation
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

// Handle researcher invitation response
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

export const assignTaskToCollaborator = async (projectId, collaboratorId, taskText) => {
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
        for (let i = 0; i < collaboratorIds.length; i += chunkSize) {
            const chunk = collaboratorIds.slice(i, i + chunkSize);
            const userQuery = query(usersCollection, where("__name__", "in", chunk));
            const userSnapshot = await getDocs(userQuery);
            userSnapshot.forEach((doc) => {
                userMap[doc.id] = doc.data().fullName || "Unnamed";
            });
        }

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
};