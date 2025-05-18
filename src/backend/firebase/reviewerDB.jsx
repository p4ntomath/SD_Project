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
  serverTimestamp,
  orderBy
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

// Create a review request
export const createReviewRequest = async (projectId, reviewerId, projectTitle, researcherName) => {
  try {
    const reviewRequest = {
      projectId,
      projectTitle,
      reviewerId,
      researcherName,
      status: "pending", // pending, accepted, rejected
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const requestRef = await addDoc(collection(db, "reviewRequests"), reviewRequest);
    return { id: requestRef.id, ...reviewRequest };
  } catch (error) {
    console.error("Error creating review request:", error);
    throw new Error("Failed to create review request");
  }
};

// Get review requests for a reviewer
export const getReviewerRequests = async (reviewerId) => {
  try {
    const requestsQuery = query(
      collection(db, "reviewRequests"),
      where("reviewerId", "==", reviewerId)
    );
    
    const querySnapshot = await getDocs(requestsQuery);
    const requests = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const request = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        requestedAt: docSnapshot.data().requestedAt?.toDate() || null,
        updatedAt: docSnapshot.data().updatedAt?.toDate() || null
      };
      
      // Fetch project details
      const projectDoc = await getDoc(doc(db, "projects", request.projectId));
      if (projectDoc.exists()) {
        request.project = {
          id: projectDoc.id,
          ...projectDoc.data()
        };
      }
      
      requests.push(request);
    }
    
    return requests;
  } catch (error) {
    console.error("Error getting review requests:", error);
    throw new Error("Failed to get review requests");
  }
};

// Update review request status
export const updateReviewRequestStatus = async (requestId, status) => {
  try {
    const requestRef = doc(db, "reviewRequests", requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Review request not found');
    }

    const requestData = requestSnap.data();
    const projectId = requestData.projectId;
    
    // Update request status
    await updateDoc(requestRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // If accepted, add reviewer to project's reviewers array with pending feedback status
    if (status === 'accepted') {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      // Get reviewer details from users collection
      const reviewerDoc = await getDoc(doc(db, "users", requestData.reviewerId));
      if (!reviewerDoc.exists()) {
        throw new Error('Reviewer not found');
      }

      const reviewerData = reviewerDoc.data();
      const reviewer = {
        id: requestData.reviewerId,
        name: reviewerData.fullName,
        fieldOfResearch: reviewerData.fieldOfResearch || "",
        reviewStatus: 'pending_feedback'  // Make sure this is always included
      };

      // Get current reviewers array
      const currentReviewers = projectSnap.data().reviewers || [];
      
      // Remove any existing entry for this reviewer
      const updatedReviewers = currentReviewers.filter(r => r.id !== reviewer.id);
      
      // Add the reviewer with updated information
      updatedReviewers.push(reviewer);

      await updateDoc(projectRef, {
        reviewers: updatedReviewers,
        updatedAt: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating review request:', error);
    throw error;
  }
};

// Submit review feedback
export const submitReviewFeedback = async (projectId, reviewerId, feedback) => {
  try {
    const reviewData = {
      projectId,
      reviewerId,
      feedback: feedback.comment,
      rating: feedback.rating,
      status: feedback.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add review to reviews collection
    const reviewRef = await addDoc(collection(db, "reviews"), reviewData);

    // Update project's reviews array and status, and update reviewer status
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      const currentReviewers = projectSnap.data().reviewers || [];
      const updatedReviewers = currentReviewers.map(reviewer => {
        if (reviewer.id === reviewerId) {
          return {
            ...reviewer,
            reviewStatus: 'feedback_submitted', // Set to feedback_submitted when review is submitted
            lastFeedback: {
              date: new Date(),
              status: feedback.status
            }
          };
        }
        return reviewer;
      });

      await updateDoc(projectRef, {
        reviews: arrayUnion(reviewRef.id),
        reviewers: updatedReviewers,
        updatedAt: serverTimestamp()
      });
    }

    // Update review request status to completed
    const requestsQuery = query(
      collection(db, "reviewRequests"),
      where("projectId", "==", projectId),
      where("reviewerId", "==", reviewerId)
    );
    const querySnapshot = await getDocs(requestsQuery);
    
    if (!querySnapshot.empty) {
      const requestDoc = querySnapshot.docs[0];
      await updateDoc(requestDoc.ref, {
        status: "completed",
        updatedAt: serverTimestamp(),
        reviewId: reviewRef.id,
        reviewStatus: feedback.status, // Update review request status to feedback_submitted
        reviewRating: feedback.rating,
        reviewComment: feedback.comment
      });
    }

    return { success: true, reviewId: reviewRef.id };
  } catch (error) {
    console.error("Error submitting review feedback:", error);
    throw new Error("Failed to submit review feedback");
  }
};

// Get all reviews for a project
export const getProjectReviews = async (projectId) => {
  try {
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("projectId", "==", projectId)
    );
    const querySnapshot = await getDocs(reviewsQuery);
    
    const reviews = [];
    for (const docSnapshot of querySnapshot.docs) {
      const review = { id: docSnapshot.id, ...docSnapshot.data() };
      // Get reviewer details
      const reviewerDoc = await getDoc(doc(db, "users", review.reviewerId));
      if (reviewerDoc.exists()) {
        const reviewerData = reviewerDoc.data();
        review.reviewer = { 
          id: reviewerDoc.id, 
          fullName: reviewerData.fullName,
          fieldOfResearch: reviewerData.fieldOfResearch || 'Not specified'
        };
      } else {
        review.reviewer = {
          id: review.reviewerId,
          fullName: 'Anonymous Reviewer',
          fieldOfResearch: 'Not specified'
        };
      }
      reviews.push(review);
    }
    
    return reviews;
  } catch (error) {
    console.error("Error getting project reviews:", error);
    throw new Error("Failed to get project reviews");
  }
};

// Get review by ID
export const getReviewById = async (reviewId) => {
  try {
    const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
    if (!reviewDoc.exists()) {
      throw new Error("Review not found");
    }
    
    const review = { id: reviewDoc.id, ...reviewDoc.data() };
    
    // Get reviewer details
    const reviewerDoc = await getDoc(doc(db, "users", review.reviewerId));
    if (reviewerDoc.exists()) {
      review.reviewer = { id: reviewerDoc.id, ...reviewerDoc.data() };
    }
    
    return review;
  } catch (error) {
    console.error("Error getting review:", error);
    throw new Error("Failed to get review");
  }
};

// Update review feedback
export const updateReviewFeedback = async (reviewId, feedback) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      feedback: feedback.comment,
      rating: feedback.rating,
      status: feedback.status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating review feedback:", error);
    throw new Error("Failed to update review feedback");
  }
};

// Get all reviews by a reviewer
export const getReviewerReviews = async (reviewerId) => {
  try {
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("reviewerId", "==", reviewerId)
    );
    const querySnapshot = await getDocs(reviewsQuery);
    
    const reviews = [];
    for (const docSnapshot of querySnapshot.docs) {
      const review = { id: docSnapshot.id, ...docSnapshot.data() };
      // Get project details
      const projectDoc = await getDoc(doc(db, "projects", review.projectId));
      if (projectDoc.exists()) {
        review.project = { id: projectDoc.id, ...projectDoc.data() };
      }
      reviews.push(review);
    }
    
    return reviews;
  } catch (error) {
    console.error("Error getting reviewer reviews:", error);
    throw new Error("Failed to get reviewer reviews");
  }
};

// Get all review requests for a project
export const getReviewerRequestsForProject = async (projectId) => {
  try {
    const requestsQuery = query(
      collection(db, "reviewRequests"),
      where("projectId", "==", projectId)
    );
    const querySnapshot = await getDocs(requestsQuery);
    
    const requests = [];
    for (const docSnapshot of querySnapshot.docs) {
      const request = { id: docSnapshot.id, ...docSnapshot.data() };
      // Get reviewer details
      const reviewerDoc = await getDoc(doc(db, "users", request.reviewerId));
      if (reviewerDoc.exists()) {
        request.reviewerName = reviewerDoc.data().fullName;
        requests.push(request);
      }
    }
    
    return requests;
  } catch (error) {
    console.error("Error getting project review requests:", error);
    throw new Error("Failed to get project review requests");
  }
};


// Add a single reviewer to project
export const addReviewerToProject = async (projectId, reviewerId) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    
    // Get reviewer details first
    const reviewerDoc = await getDoc(doc(db, "users", reviewerId));
    if (!reviewerDoc.exists()) {
      throw new Error('Reviewer not found');
    }

    const reviewerData = reviewerDoc.data();
    const reviewer = {
      id: reviewerId,
      name: reviewerData.fullName,
      fieldOfResearch: reviewerData.fieldOfResearch || "",
      reviewStatus: 'pending_feedback'
    };

    // Get current reviewers array and update it
    const projectDoc = await getDoc(projectRef);
    const currentReviewers = projectDoc.exists() ? (projectDoc.data().reviewers || []) : [];
    const updatedReviewers = [...currentReviewers.filter(r => r.id !== reviewerId), reviewer];

    await updateDoc(projectRef, {
      reviewers: updatedReviewers,
      updatedAt: serverTimestamp()
    });
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


// Update existing reviewer information in projects
export const updateExistingReviewerInfo = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    const currentReviewers = projectData.reviewers || [];

    // Fetch updated reviewer details
    const reviewerPromises = currentReviewers.map(async (reviewer) => {
      const reviewerDoc = await getDoc(doc(db, "users", reviewer.id));
      if (!reviewerDoc.exists()) {
        return reviewer; // Keep existing data if reviewer not found
      }
      const reviewerData = reviewerDoc.data();
      return {
        id: reviewer.id,
        name: reviewerData.fullName,
        fieldOfResearch: reviewerData.fieldOfResearch || null,
        reviewStatus: reviewer.reviewStatus || 'pending_feedback' // Maintain existing status or set default
      };
    });

    const updatedReviewers = await Promise.all(reviewerPromises);

    // Update project with refreshed reviewer details
    await updateDoc(projectRef, {
      reviewers: updatedReviewers,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating reviewer information:', error);
    throw error;
  }
};

// Get review history for a reviewer
export const getReviewerHistory = async (reviewerId) => {
  try {
    if (!reviewerId) {
      throw new Error('Reviewer ID is required');
    }

    const reviewsQuery = query(
      collection(db, "reviews"),
      where("reviewerId", "==", reviewerId)
    );
    const querySnapshot = await getDocs(reviewsQuery);
    
    const reviews = [];
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const reviewData = docSnapshot.data();
        const review = { 
          id: docSnapshot.id,
          ...reviewData,
          status: reviewData.status || 'pending',
          rating: reviewData.rating || 0,
          feedback: reviewData.feedback || '',
          createdAt: reviewData.createdAt || null,
          updatedAt: reviewData.updatedAt || null
        };

        // Only process if projectId exists
        if (review.projectId) {
          const projectDoc = await getDoc(doc(db, "projects", review.projectId));
          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            review.projectTitle = projectData.title || 'Untitled Project';
            
            // Only attempt to get researcher details if createdBy exists
            if (projectData.userId) {
              const researcherDoc = await getDoc(doc(db, "users", projectData.userId));
              review.researcherName = researcherDoc.exists() 
                ? researcherDoc.data().fullName 
                : "Unknown Researcher";
            } else {
              review.researcherName = "Unknown Researcher";
            }
          } else {
            review.projectTitle = "Project Not Found";
            review.researcherName = "Unknown Researcher";
          }
        } else {
          review.projectTitle = "Project Not Found";
          review.researcherName = "Unknown Researcher";
        }
        
        reviews.push(review);
      } catch (innerError) {
        console.error("Error processing review document:", innerError);
        // Continue with next review instead of failing completely
        continue;
      }
    }
    
    // Sort the reviews by createdAt timestamp after fetching
    return reviews.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA; // Sort in descending order (newest first)
    });
  } catch (error) {
    console.error("Error getting reviewer history:", error);
    throw new Error("Failed to get reviewer history");
  }
};