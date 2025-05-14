import { db, auth } from "./firebaseConfig";
import { query, where, serverTimestamp } from "firebase/firestore";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    arrayUnion,
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

/**
 * Get all pending collaboration invitations for a project
 * @param {string} projectId - The ID of the project to check invitations for
 * @returns {Promise<Array>} Array of pending invitations with researcher details
 */
export const getPendingCollaboratorInvitations = async (projectId) => {
    try {
        const invitationsQuery = query(
            collection(db, "invitations"),
            where("projectId", "==", projectId),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const pendingInvitations = await Promise.all(
            invitationsSnapshot.docs.map(async (docSnapshot) => {
                const invitationData = docSnapshot.data();
                const researcherDoc = await getDoc(doc(db, "users", invitationData.researcherId));
                const researcherData = researcherDoc.data();
                
                return {
                    invitationId: docSnapshot.id,
                    researcherId: invitationData.researcherId,
                    researcherName: researcherData?.fullName || "Unknown Researcher",
                    researcherInstitution: researcherData?.institution || "Unknown Institution",
                    createdAt: invitationData.createdAt,
                    status: invitationData.status
                };
            })
        );
        
        return pendingInvitations;
    } catch (error) {
        console.error("Error fetching pending invitations:", error);
        throw new Error("Failed to fetch pending invitations");
    }
};

/**
 * Get all pending collaboration invitations sent by a researcher
 * @param {string} senderId - The ID of the researcher who sent the invitations
 * @returns {Promise<Array>} Array of pending invitations with researcher details
 */
export const getSentInvitations = async (senderId) => {
    try {
        const invitationsQuery = query(
            collection(db, "invitations"),
            where("senderId", "==", senderId),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const pendingInvitations = await Promise.all(
            invitationsSnapshot.docs.map(async (doc) => {
                const invitationData = doc.data();
                const researcherDoc = await getDoc(doc(db, "users", invitationData.researcherId));
                const researcherData = researcherDoc.data();
                const projectDoc = await getDoc(doc(db, "projects", invitationData.projectId));
                const projectData = projectDoc.data();
                
                return {
                    invitationId: doc.id,
                    researcherId: invitationData.researcherId,
                    researcherName: researcherData?.fullName || "Unknown Researcher",
                    researcherInstitution: researcherData?.institution || "Unknown Institution",
                    projectTitle: projectData?.title || "Unknown Project",
                    sentAt: invitationData.createdAt,
                    status: invitationData.status
                };
            })
        );
        
        return pendingInvitations;
    } catch (error) {
        console.error("Error fetching sent invitations:", error);
        throw new Error("Failed to fetch sent invitations");
    }
};

/**
 * Get all pending collaboration invitations received by a researcher
 * @param {string} researcherId - The ID of the researcher who received the invitations
 * @returns {Promise<Array>} Array of pending invitations with project and sender details
 */
export const getReceivedInvitations = async (researcherId) => {
    try {
        const invitationsQuery = query(
            collection(db, "invitations"),
            where("researcherId", "==", researcherId),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const pendingInvitations = await Promise.all(
            invitationsSnapshot.docs.map(async (docSnapshot) => {
                const invitationData = docSnapshot.data();
                const senderDoc = await getDoc(doc(db, "users", invitationData.senderId));
                const senderData = senderDoc.data();
                const projectDoc = await getDoc(doc(db, "projects", invitationData.projectId));
                const projectData = projectDoc.data();
                
                return {
                    invitationId: docSnapshot.id,
                    senderId: invitationData.senderId,
                    senderName: senderData?.fullName || "Unknown Sender",
                    senderInstitution: senderData?.institution || "Unknown Institution",
                    projectId: invitationData.projectId,
                    projectTitle: projectData?.title || "Unknown Project",
                    projectDescription: projectData?.description || "No description available",
                    projectMilestones: projectData?.goals || [],
                    sentAt: invitationData.createdAt,
                    status: invitationData.status
                };
            })
        );
        
        return pendingInvitations;
    } catch (error) {
        console.error("Error fetching received invitations:", error);
        throw new Error("Failed to fetch received invitations");
    }
};