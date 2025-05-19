import { db, auth } from "./firebaseConfig";
import { query, where, arrayUnion, serverTimestamp } from "firebase/firestore";
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import {
  collection,
  setDoc,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

export function useUnreadNotificationsCount() {
  const [count, setCount] = useState(0);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', auth.currentUser.uid), // updated field
      where('readStatus', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [auth.currentUser, db]);

  return count;
}

export function useUnreadMessagesCount() {
  const [count, setCount] = useState(0);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const userChatsRef = doc(db, 'userChats', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userChatsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setCount(0);
        return;
      }
      
      const data = snapshot.data();
      const totalUnread = Object.values(data.unreadCount || {}).reduce((sum, count) => sum + count, 0);
      setCount(totalUnread);
    });
    
    return () => unsubscribe();
  }, [auth.currentUser, db]);

  return count;
}

export const getUserById = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data(); // Should contain fullName, email, etc.
  }
  return null;
};

const notificationTemplates = {
  // Goals Card
  "Goal Completed": ({ goalText, projectTitle }) =>
    `You have successfully completed the goal "${goalText}" in the project "${projectTitle}".`,

  "New Goal Added": ({ goalText, projectTitle }) =>
    `A new goal "${goalText}" has been added to your project "${projectTitle}".`, 
  "Goal Deleted": ({ goalText, projectTitle }) =>
    `The goal "${goalText}" has been deleted from your project "${projectTitle}".`,

  "Project Completed": ({ projectTitle }) =>
    `Congratulations! The project "${projectTitle}" has been marked as complete.`,

  "Project Created": ({ projectTitle }) =>
    `Your project "${projectTitle}" was created successfully.`,

  "Project Deleted": ({ projectTitle }) =>
    `Your project "${projectTitle}" has been deleted.`,

  "Project Updated": ({ projectTitle }) =>
    `Your project "${projectTitle}" has been updated.`,

  // Funding Card
  "Funds Added": ({ amount, projectTitle }) =>
    `An amount of R${amount.toLocaleString()} has been added to your project "${projectTitle}".`,

  "Expense Added": ({ amount, description, projectTitle }) =>
    `A new expense of R${amount.toLocaleString()} (${description}) has been recorded for your project "${projectTitle}".`,

  // Document Card
  "Folder Created": ({ folderName, projectTitle }) =>
    `A new folder "${folderName}" was created in your project "${projectTitle}".`,

  "Folder Deleted": ({ folderName, projectTitle }) =>
    `The folder "${folderName}" was deleted from your project "${projectTitle}".`,

  "Folder Updated": ({ folderName, projectTitle }) =>
    `The folder "${folderName}" was updated in your project "${projectTitle}".`,

  "Folder Renamed": ({ folderName, projectTitle, newFolderName }) =>
    `The folder "${folderName}" has been renamed to "${newFolderName}" in your project "${projectTitle || 'Untitled Project'}".`,

  "File Uploaded": ({ documentName, folderName, projectTitle }) =>
    `The file "${documentName}" was uploaded to the folder "${folderName}" in your project "${projectTitle}".`,

  "File Deleted": ({ documentName, folderName, projectTitle }) =>
    `The file "${documentName}" was deleted from the folder "${folderName}" in your project "${projectTitle}".`,

  "File Updated": ({ documentName, folderName, projectTitle }) =>
    `The file "${documentName}" was updated in the folder "${folderName}" in your project "${projectTitle}".`,

  // Reviewer Card
  "Reviewer Request Sent": ({ reviewerName, projectTitle }) =>
    `Your review request was sent seccussfully, Please wait for a reply from the reviewer.`,

  "Reviewer Request Received": ({ researcherName, projectTitle }) =>
    `You have received a review request on a project, go to your requests to check it out!!.`,

  "Reviewer Accepted": ({ researcherName, projectTitle }) =>
    `You have accepted the review request for the project "${projectTitle}" by ${researcherName}.`,

  "Reviewer Request Accepted": ({ reviewerName, projectTitle }) =>
    `${reviewerName} has accepted your review request for the project "${projectTitle}".`,

  "Reviewer Denied": ({ researcherName, projectTitle }) =>
    `You have declined the review request for the project "${projectTitle}" by ${researcherName}.`,

  "Reviewer Request Denied": ({ reviewerName, projectTitle }) =>
    `${reviewerName} has declined your review request for the project "${projectTitle}".`,

  "Review Submitted": ({ researcherName, projectTitle }) =>
    `You have submitted your review for the project "${projectTitle}" by ${researcherName}.`,

  "Review Received": ({ reviewerName, projectTitle }) =>
    `You have received a review for your project "${projectTitle}" from ${reviewerName}.`,

//Collaborator Card
  "Collaboration Request Sent": ({ researcherName, projectTitle }) =>
    `You have sent a collaboration request to ${researcherName} on your project, "${projectTitle}".`,
  
  "Collaboration Request Received": ({ projectTitle, researcherName }) =>
    `You have received a collaboration request from ${researcherName} on their project, "${projectTitle}".`,

  "Collaboration Request Accepted": ({ projectTitle, researcherName }) =>
    `Your collaboration request for the project "${projectTitle}" has been accepted by ${researcherName}.`,

  "Collaboration Request Declined": ({ projectTitle, researcherName }) =>
    `Your collaboration request for the project "${projectTitle}" has been Declined by ${researcherName}.`,


};

export const notify = async ({
  type,
  projectId,
  projectTitle,
  goalText,
  folderName,
  newFolderName,
  documentName,
  amount,
  description,
  reviewerName,
  researcherName,
  targetUserId, // recipient
  senderUserId, // actor
}) => {
  const target = targetUserId || auth.currentUser?.uid;
  const sender = senderUserId || auth.currentUser?.uid;

  if (!target) {
    console.error("Target user ID not provided and user not authenticated");
    return;
  }
  if (!projectId) {
    console.error("Project ID is undefined. Cannot send notification.");
    return;
  }
  const template = notificationTemplates[type];
  if (!template) {
    console.error("Unknown notification type:", type);
    return;
  }

  const message = template({ goalText, projectTitle, documentName, amount, description, folderName,newFolderName , reviewerName, researcherName });

  const notificationsRef = collection(db, "notifications");
  await addDoc(notificationsRef, {
    targetUserId: target,
    senderUserId: sender,
    projectId,
    message,
    type,
    timestamp: new Date().toISOString(),
    readStatus: false,
  });
};

