import { db, auth } from "./firebaseConfig";
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    updateDoc, 
    query, 
    where, 
    serverTimestamp,
    arrayUnion 
} from "firebase/firestore";

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
        return querySnapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            requestedAt: docSnapshot.data().requestedAt?.toDate() || null,
            updatedAt: docSnapshot.data().updatedAt?.toDate() || null
        }));
    } catch (error) {
        console.error("Error getting review requests:", error);
        throw new Error("Failed to get review requests");
    }
};

// Update review request status
export const updateReviewRequestStatus = async (requestId, status) => {
    try {
        const requestRef = doc(db, "reviewRequests", requestId);
        const requestDoc = await getDoc(requestRef);
        
        if (!requestDoc.exists()) {
            throw new Error("Review request not found");
        }

        await updateDoc(requestRef, {
            status,
            updatedAt: serverTimestamp()
        });

        if (status === 'accepted') {
            const request = requestDoc.data();
            // Add reviewer to project's reviewers array
            const projectRef = doc(db, "projects", request.projectId);
            await updateDoc(projectRef, {
                reviewers: arrayUnion({
                    id: request.reviewerId,
                    status: 'active',
                    assignedAt: serverTimestamp()
                })
            });
        }

        return true;
    } catch (error) {
        console.error("Error updating review request:", error);
        throw new Error("Failed to update review request");
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

        // Update project's reviews array
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            reviews: arrayUnion(reviewRef.id),
            updatedAt: serverTimestamp()
        });

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
                review.reviewer = { id: reviewerDoc.id, ...reviewerDoc.data() };
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