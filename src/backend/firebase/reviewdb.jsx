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

export const fetchReviewRequests = async (userId) => {
  try {
    // Step 1: Fetch all reviewer invitations for the user
    const invitationsRef = collection(db, "invitations");
    const invitationQuery = query(
      invitationsRef,
      where("reviewerId", "==", userId),
      where("type", "==", "reviewer")
    );

    const invitationSnapshot = await getDocs(invitationQuery);

    // Step 2: Fetch corresponding projects
    const reviewRequests = await Promise.all(
      invitationSnapshot.docs.map(async (docSnap) => {
        const invitationData = docSnap.data();
        const projectRef = doc(db, "projects", invitationData.projectId);
        const projectSnap = await getDoc(projectRef);
        const projectData = projectSnap.exists() ? projectSnap.data() : null;

        return {
          invitationId: docSnap.id,
          status: invitationData.status,
          senderId: invitationData.senderId,
          createdAt: invitationData.createdAt?.toDate?.() || null,
          project: projectData ? { id: projectSnap.id, ...projectData } : null,
        };
      })
    );

    return reviewRequests.filter((req) => req.project !== null);
  } catch (error) {
    console.error("Error fetching review requests:", error);
    throw new Error("Failed to fetch review requests");
  }
};

export const addReviewerToProject = async (projectId, reviewerId) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      reviewer: arrayUnion(reviewerId), // Use Firestore's arrayUnion to add the collaborator without duplicating
    });
    console.log("Reviewer added successfully");
  } catch (error) {
    console.error("Error adding reviewer:", error.message, error.stack);
    throw new Error("Failed to add reviewer");
  }
};

export const respondToInvitation = async (invitationId, accepted) => {
  try {
    const invitationRef = doc(db, "invitations", invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      throw new Error("Invitation not found");
    }

    const invitation = invitationSnap.data();
    const { projectId, reviewerId } = invitation;

    if (accepted) {
      await addReviewerToProject(projectId, reviewerId);
      await updateDoc(invitationRef, { status: "accepted" });
    } else {
      await updateDoc(invitationRef, { status: "declined" });
    }

    console.log(`Invitation ${accepted ? "accepted" : "declined"}`);
  } catch (error) {
    console.error("Error responding to invitation:", error.message);
    throw new Error("Failed to respond to invitation");
  }
};
