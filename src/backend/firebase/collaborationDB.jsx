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
    limit,
    startAfter,
    orderBy
} from "firebase/firestore";

/**

 * Adds a collaborator to a project with default "Collaborator" access and specific permissions.
 * @param {string} projectId - The ID of the project.
 * @param {string} collaboratorId - The ID of the collaborator to add.
 * @returns {Promise<void>}
 */
export const addCollaboratorToProject = async (projectId, collaboratorId) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const collaboratorDoc = await getDoc(doc(db, "users", collaboratorId));
        
        if (!collaboratorDoc.exists()) {
            throw new Error("Collaborator not found");
        }

        const collaboratorData = {
            id: collaboratorId,
            fullName: collaboratorDoc.data().fullName,
            institution: collaboratorDoc.data().institution,
            fieldOfResearch: collaboratorDoc.data().fieldOfResearch,
            accessLevel: "Collaborator",
            permissions: {
                canUploadFiles: true,
                canCompleteGoals: true,
                canAddFunds: true,
                canEditProjectDetails: false,
                canManageGoals: false,
                canManageCollaborators: false
            }
        };

        await updateDoc(projectRef, {
            collaborators: arrayUnion(collaboratorData),

            updatedAt: serverTimestamp()
        });

        
    } catch (error) {
        
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
export const updateCollaboratorAccessLevel = async (projectId, collaboratorId, newAccessLevel) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error("Project does not exist");
        }

        const projectData = projectSnap.data();
        const currentCollaborators = projectData.collaborators || [];
        
        // Define permissions based on access level
        const accessLevelPermissions = {
            Viewer: {
                canViewProject: true,
                canCompleteGoals: false,
                canAddFunds: false,
                canUploadFiles: false,
                canManageGoals: false,
                canManageCollaborators: false,
                canEditProjectDetails: false
            },
            Editor: {
                canViewProject: true,
                canCompleteGoals: true,
                canAddFunds: false,
                canUploadFiles: true,
                canManageGoals: true,
                canManageCollaborators: false,
                canEditProjectDetails: true
            },
            Collaborator: {
                canViewProject: true,
                canCompleteGoals: true,
                canAddFunds: true,
                canUploadFiles: true,
                canManageGoals: true,
                canManageCollaborators: false,
                canEditProjectDetails: false
            }
        };

        const updatedCollaborators = currentCollaborators.map(collab =>
            collab.id === collaboratorId ? { 
                ...collab, 
                accessLevel: newAccessLevel,
                permissions: accessLevelPermissions[newAccessLevel] || accessLevelPermissions.Viewer
            } : collab
        );

        await updateDoc(projectRef, {
            collaborators: updatedCollaborators,
            updatedAt: serverTimestamp()
        });

        
    } catch (error) {
        
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

        
    } catch (error) {
        
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

        // First, get all researchers
        const researcherQuery = query(
            usersCollection,
            where("role", "==", "researcher")
        );
        const querySnapshot = await getDocs(researcherQuery);

        // Check pending invitations
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
        console.error("Error searching for researchers:", error.message, error.stack);
        throw new Error("Failed to search for researchers");
    }
};

/**

 * Adds a researcher as a collaborator to a project
 * @param {string} projectId - The ID of the project
 * @param {string} researcherId - The ID of the researcher to add
 * @param {string} [role="Collaborator"] - The role to assign to the researcher
 * @returns {Promise<void>}
 */
const addResearcherToProject = async (projectId, researcherId, role = 'Collaborator') => {
    try {
        // Get researcher details
        const researcherDoc = await getDoc(doc(db, "users", researcherId));
        if (!researcherDoc.exists()) {
            throw new Error("Researcher not found");
        }
        const researcherData = researcherDoc.data();
        const permissions = {
            Viewer: {
                canViewProject: true,
                canCompleteGoals: false,
                canAddFunds: false,
                canUploadFiles: false,
                canManageGoals: false,
                canManageCollaborators: false,
                canEditProjectDetails: false
            },
            Editor: {
                canViewProject: true,
                canCompleteGoals: true,
                canAddFunds: false,
                canUploadFiles: true,
                canManageGoals: true,
                canManageCollaborators: false,
                canEditProjectDetails: true
            },
            Collaborator: {
                canViewProject: true,
                canCompleteGoals: true,
                canAddFunds: true,
                canUploadFiles: true,
                canManageGoals: true,
                canManageCollaborators: false,
                canEditProjectDetails: false
            }
        };

        const collaborator = {
            id: researcherId,
            researcherId: researcherId,
            name: researcherData.fullName,
            fullName: researcherData.fullName,
            institution: researcherData.institution,
            accessLevel: role,
            permissions: permissions[role] || permissions.Viewer
        };

        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            collaborators: arrayUnion(collaborator),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding researcher to project:", error.message);
        throw new Error("Failed to add researcher to project");
    }
};

/**
 * Sends an invitation to a researcher for a project.
 * @param {string} projectId - The ID of the project.
 * @param {string} researcherId - The ID of the researcher to invite.
 * @param {string} senderId - The ID of the user sending the invitation.
 * @param {string} [role="Collaborator"] - The role to assign to the researcher.
 * @returns {Promise<Object>} - Result object with success status and message.
 */
export const sendResearcherInvitation = async (projectId, researcherId, senderId, role = 'Collaborator') => {
    try {
        // Check if there's already a pending invitation for this researcher and project
        const existingInvitationQuery = query(
            collection(db, "invitations"),
            where("projectId", "==", projectId),
            where("researcherId", "==", researcherId),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        
        const existingInvitations = await getDocs(existingInvitationQuery);
        if (!existingInvitations.empty) {
            throw new Error("An invitation has already been sent to this researcher");
        }

        // Check if researcher is already a collaborator
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
            throw new Error("Project not found");
        }

        const projectData = projectSnap.data();
        const isAlreadyCollaborator = projectData.collaborators?.some(
            collaborator => collaborator.id === researcherId
        );

        if (isAlreadyCollaborator) {
            throw new Error("This researcher is already a collaborator on this project");
        }

        // If no existing invitation or collaboration, create new invitation
        const invitationRef = collection(db, "invitations");
        await addDoc(invitationRef, {
            projectId,
            researcherId,
            senderId,
            status: "pending",
            type: "researcher",
            role: role,
            createdAt: serverTimestamp(),
        });

        return { success: true, message: "Invitation sent successfully" };
    } catch (error) {
       
        throw error; // Throw the original error to preserve the message
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
        const { projectId, researcherId, role } = invitation;

        if (accepted) {
            await addResearcherToProject(projectId, researcherId, role);
            await updateDoc(invitationRef, {
                status: "accepted",
                updatedAt: serverTimestamp()
            });

            // Find and add to project group chat if it exists
            const chatsQuery = query(
                collection(db, "chats"),
                where("type", "==", "group"),
                where("projectId", "==", projectId)
            );
            const chatSnapshot = await getDocs(chatsQuery);
            
            if (!chatSnapshot.empty) {
                const projectChat = chatSnapshot.docs[0];
                const ChatService = (await import("./chatDB.jsx")).ChatService;
                await ChatService.addUserToGroupChat(projectChat.id, researcherId);
            }
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
            invitationsSnapshot.docs.map(async (docSnapshot) => {
                const invitationData = docSnapshot.data();
                const researcherDoc = await getDoc(doc(db, "users", invitationData.researcherId));
                const researcherData = researcherDoc.data();
                const projectDoc = await getDoc(doc(db, "projects", invitationData.projectId));
                const projectData = projectDoc.data();
                
                return {
                    invitationId: docSnapshot.id,
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

/**
 * Get all researchers from the database, with pagination support
 * @param {string} currentUserId - The ID of the current user to exclude
 * @param {Object} project - The current project object to check existing collaborators
 * @param {number} pageSize - Number of researchers to fetch per page
 * @param {Object} lastDoc - The last document from the previous page
 * @returns {Promise<{researchers: Array, lastDoc: Object, hasMore: boolean}>} Paginated researchers data
 */
export const getAllResearchers = async (currentUserId, project, pageSize = 10, lastDoc = null) => {
    try {
        // Base query filtering only researchers
        let baseQuery = query(
            collection(db, "users"),
            where("role", "==", "researcher"),
            orderBy("fullName"),
            limit(pageSize)
        );

        // If we have a last document, start after it
        if (lastDoc) {
            baseQuery = query(baseQuery, startAfter(lastDoc));
        }

        const usersSnap = await getDocs(baseQuery);
        
        // Get array of existing collaborator IDs
        const existingCollaboratorIds = project?.collaborators?.map(c => c.id) || [];
        
        // Get IDs of users with pending invitations
        const pendingInvitationsQuery = query(
            collection(db, "invitations"),
            where("projectId", "==", project.id),
            where("type", "==", "researcher"),
            where("status", "==", "pending")
        );
        const pendingInvitationsSnap = await getDocs(pendingInvitationsQuery);
        const pendingResearcherIds = pendingInvitationsSnap.docs.map(doc => doc.data().researcherId);

        // Combine all IDs to exclude
        const excludeIds = [...existingCollaboratorIds, ...pendingResearcherIds, currentUserId];

        // Filter and format researchers
        const researchers = usersSnap.docs
            .map(doc => ({
                id: doc.id,
                fullName: doc.data().fullName,
                institution: doc.data().institution,
                fieldOfResearch: doc.data().fieldOfResearch
            }))
            .filter(researcher => !excludeIds.includes(researcher.id));

        // Check if there are more researchers to load
        const hasMore = !usersSnap.empty && researchers.length === pageSize;
        
        // Get the last visible document for next pagination
        const lastVisible = usersSnap.docs[usersSnap.docs.length - 1];

        return {
            researchers,
            lastDoc: lastVisible,
            hasMore
        };
    } catch (error) {
        console.error("Error getting researchers:", error);
        throw error;
    }
};
