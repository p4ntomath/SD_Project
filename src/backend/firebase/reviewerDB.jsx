import { db } from './firebaseConfig';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, getDocs, query, where } from 'firebase/firestore';

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

// Assign reviewers to a project
export const assignReviewers = async (projectId, reviewerIds) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      reviewers: arrayUnion(...reviewerIds),
      status: 'Under Review'
    });
    return true;
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    throw error;
  }
};

// Remove reviewer from project
export const removeReviewer = async (projectId, reviewerId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      reviewers: arrayRemove(reviewerId)
    });
    return true;
  } catch (error) {
    console.error('Error removing reviewer:', error);
    throw error;
  }
};