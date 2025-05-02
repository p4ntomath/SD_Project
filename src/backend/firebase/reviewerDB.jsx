import { db, auth } from "./firebaseConfig";
import { 
  collection, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDocs, 
  getDoc,
  addDoc,
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';

// Get all available reviewers
export const getAvailableReviewers = async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'reviewer'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    throw error;
  }
};

// Fetch review requests for a reviewer
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

// Assign reviewers to a project
export const assignReviewers = async (projectId, reviewerIds) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      reviewers: arrayUnion(...reviewerIds),
      status: 'Under Review',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    throw error;
  }
};

// Add a single reviewer to project
export const addReviewerToProject = async (projectId, reviewerId) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      reviewer: arrayUnion(reviewerId),
      updatedAt: serverTimestamp()
    });
    console.log("Reviewer added successfully");
  } catch (error) {
    console.error("Error adding reviewer:", error.message, error.stack);
    throw new Error("Failed to add reviewer");
  }
};

// Remove reviewer from project
export const removeReviewer = async (projectId, reviewerId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      reviewers: arrayRemove(reviewerId),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error removing reviewer:', error);
    throw error;
  }
};

// Handle invitation response
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
    console.error("Error responding to invitation:", error.message);
    throw new Error("Failed to respond to invitation");
  }
};

// Send reviewer invitation
export const sendReviewerInvitation = async (projectId, reviewerId, senderId) => {
  try {
    const invitationRef = collection(db, "invitations");
    await addDoc(invitationRef, {
      projectId,
      reviewerId,
      senderId,
      status: "pending",
      type: "reviewer",
      createdAt: serverTimestamp(),
    });
    return { success: true, message: "Invitation sent successfully" };
  } catch (error) {
    console.error("Error sending invitation:", error.message, error.stack);
    throw new Error("Failed to send invitation");
  }
};

// Submit review feedback for a project
export const submitReviewFeedback = async (projectId, reviewerId, feedback) => {
  try {
    // Create a new feedback document
    const feedbackRef = collection(db, "reviews");
    const newFeedback = await addDoc(feedbackRef, {
      projectId,
      reviewerId,
      feedback: feedback.comment,
      rating: feedback.rating,
      status: feedback.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update the project's reviews array
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      reviews: arrayUnion(newFeedback.id),
      updatedAt: serverTimestamp()
    });

    return { success: true, feedbackId: newFeedback.id };
  } catch (error) {
    console.error("Error submitting review feedback:", error);
    throw new Error("Failed to submit review feedback");
  }
};

// Get feedback for a project
export const getProjectFeedback = async (projectId) => {
  try {
    const feedbackRef = collection(db, "reviews");
    const q = query(feedbackRef, where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    
    const feedback = [];
    for (const doc of querySnapshot.docs) {
      const feedbackData = doc.data();
      // Get reviewer details
      const reviewerRef = doc(db, "users", feedbackData.reviewerId);
      const reviewerSnap = await getDoc(reviewerRef);
      const reviewerData = reviewerSnap.exists() ? reviewerSnap.data() : null;

      feedback.push({
        id: doc.id,
        ...feedbackData,
        reviewer: reviewerData ? {
          id: reviewerSnap.id,
          name: reviewerData.fullName,
          expertise: reviewerData.expertise
        } : null,
        createdAt: feedbackData.createdAt?.toDate() || null,
        updatedAt: feedbackData.updatedAt?.toDate() || null
      });
    }

    return feedback;
  } catch (error) {
    console.error("Error getting project feedback:", error);
    throw new Error("Failed to get project feedback");
  }
};