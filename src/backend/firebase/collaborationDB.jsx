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
export const searchResearchers = async (searchTerm, currentUserId, project) => {
    try {
        const usersCollection = collection(db, "users");

        // First, get all researchers
        const researcherQuery = query(
            usersCollection,
            where("role", "==", "researcher")
        );
        const querySnapshot = await getDocs(researcherQuery);

        // Filter locally based on first name
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
                //Filter by name is not complete, also includes current_user name too
                return nameMatches && !isCurrentUser && !isCollaborator;
            });

        return researchers;
    } catch (error) {
        console.error("Error searching for researchers:", error);
        throw new Error("Failed to search for researchers");
    }
};

export const searchReviewers = async (searchTerm, currentUserId, project) => {
    try {
        const usersCollection = collection(db, "users");

        // Query all users with role "reviewer"
        const reviewerQuery = query(
            usersCollection,
            where("role", "==", "reviewer")
        );
        const querySnapshot = await getDocs(reviewerQuery);

        const invitationsQuery = query(
            collection(db, "invitations"),
            where("projectId", "==", project.id || project.projectId),
            where("type", "==", "reviewer"),
            where("status", "==", "pending")
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        const invitedReviewerIds = invitationsSnapshot.docs.map(doc => doc.data().reviewerId);

        // Filter locally based on first name
        const reviewers = querySnapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter((reviewer) => {
                const nameMatches = reviewer.fullName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const isCurrentUser = reviewer.id === currentUserId;
                const isAlreadyReviewer = project.reviewer?.includes(reviewer.id);

                const isAlreadyInvited = invitedReviewerIds.includes(reviewer.id);

                return nameMatches && !isCurrentUser && !isAlreadyReviewer && !isAlreadyInvited;
            });

        return reviewers;
    } catch (error) {
        console.error("Error searching for reviewers:", error);
        throw new Error("Failed to search for reviewers");
    }
};




