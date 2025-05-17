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
      where('userId', '==', auth.currentUser.uid),
      where('readStatus', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [auth.currentUser, db]);

  return count;
}

const notificationTemplates = {
    
    //Goals Card
  "Goal Completion": ({ goalText, projectTitle }) =>
    `You completed the goal: "${goalText}" on project: "${projectTitle}".`,

  "Project Completion": ({ projectTitle }) =>
    `Congratulations! Your project "${projectTitle}" is now complete.`,

  "Project Created": ({ projectTitle }) =>
    `Congratulations! Your project "${projectTitle}" has been created.`,

  "Project Deleted": ({ projectTitle }) =>
    `Your project "${projectTitle}" has been deleted.`,

  "Project Updated": ({ projectTitle }) =>
    `Your project "${projectTitle}" has been updated.`,

  //Funding Card
  "Funds Added": ({ amount, projectTitle }) =>
    `Funds of R${amount.toLocaleString()} have been added to your project "${projectTitle}".`,

  "Expense Added": ({ amount, description, projectTitle }) =>
    `An expense of R${amount.toLocaleString()} (${description}) has been recorded for your project "${projectTitle}".`,

  //Document Card
  "Folder Created": ({ folderName, projectTitle }) =>
    `A new folder "${folderName}" has been created in your project "${projectTitle}".`,

  "Folder Deleted": ({ folderName, projectTitle }) =>
    `The folder "${folderName}" has been deleted from your project "${projectTitle}".`,

  "Folder Updated": ({ folderName, projectTitle }) =>
    `The folder "${folderName}" has been updated in your project "${projectTitle}".`,

  "File Uploaded": ({ documentName, folderName, projectTitle }) =>
    `A new file "${documentName}" has been uploaded to the folder "${folderName}" in your project "${projectTitle}".`, 

  "File Deleted": ({ documentName, folderName, projectTitle }) =>     
    `The file "${documentName}" has been deleted from the folder "${folderName}" in your project "${projectTitle}".`,

  "File Updated": ({ documentName, folderName, projectTitle }) =>
    `The file "${documentName}" has been updated in the folder "${folderName}" in your project "${projectTitle}".`,

    //Reviewer Card
  "Reviewer Request Sent": ({ reviewerName, projectTitle }) =>    
    `You have send a review request to ${reviewerName} on your project, "${projectTitle}".`,
  "Reviewer Request Received": ({ researcherName, projectTitle }) =>
    `You have received a review request from ${researcherName} on their project, "${projectTitle}".`,

  "Reviewer Accepted": ({ researcherName, projectTitle }) =>
    `You have accepted to review the project, "${projectTitle}", by ${researcherName}.`,
  "Reviewer Request Accepted": ({ reviewerName, projectTitle }) =>  
    ` ${reviewerName} has accepted to review your project, "${projectTitle}".`,

  "Reviewer Denied": ({ researcherName, projectTitle }) =>
    `You have denied the review request for the project "${projectTitle}" by ${researcherName}.`,
  "Reviewer Request Denied": ({ reviewerName, projectTitle }) =>
    `Your request to review the project "${projectTitle}" has been denied by ${reviewerName}.`, 

};

export const notify = async ({
  type,
  projectId,
  projectTitle,
  goalText,
  folderName,
  documentName,
  amount,
  description,
  reviewerName,
  researcherName,
  userId, 
}) => {
  // Use the provided userId if available, otherwise fall back to current user
  const targetUserId = userId || auth.currentUser?.uid;
  
  if (!targetUserId) {
    console.error("User ID not provided and user not authenticated");
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
  
  const message = template({ goalText, projectTitle, documentName, amount, description, folderName, reviewerName, researcherName });
  
  const notificationsRef = collection(db, "notifications");
  await addDoc(notificationsRef, {
    userId: targetUserId, // Use the target user ID here
    projectId,
    message,
    type,
    timestamp: new Date().toISOString(),
    readStatus: false,
  });
};