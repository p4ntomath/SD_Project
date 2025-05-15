import { collection, query, where, getDocs, doc, getDoc, updateDoc,deleteObject } from "firebase/firestore";
import { auth,db,storage } from "./firebaseConfig";
import { fetchProject } from "./projectDB";
import {  ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const project = async (uid) => {//fetch project names for researchers and collaborators
  try {
    const projects = await fetchProjects(uid);
    const projectNames = projects.map(p => p.name); // get project names
    return projectNames;
  } catch (error) {
    console.error("Error getting projects:", error);
    throw error;
  }
};

export const fetchUserById = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
     
      return {
        fullName: userData.fullName || null,
      };
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};




export const fetchProjectsReviewed = async (uid) => {//fetching all the projects that the reviewer has reviewed
  
  const reviewsCollection = collection(db, "reviews");
  const userReviewsQuery = query(reviewsCollection, where("reviewerId", "==", uid));
  const reviewsSnapshot = await getDocs(userReviewsQuery);

  
  const projectIds = reviewsSnapshot.docs.map(doc => doc.data().projectId);

  const projectsCollection = collection(db, "projects");

  const projectPromises = projectIds.map(async (projectId) => {
    const projectDocRef = doc(db, "projects", projectId);
    const projectDocSnap = await getDoc(projectDocRef);
    if (projectDocSnap.exists()) {
      return {
        id: projectId,
        
        title: projectDocSnap.data().title,
      };
    } else {
      return null; // in case the project doc doesn't exist
    }
  });

  const projects = await Promise.all(projectPromises);
  return projects.filter(project => project !== null);
};

export const uploadUserProfilePicture = async (file) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  // 1. Reference for the file in storage
  const fileRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);

  // 2. Upload the file
  await uploadBytes(fileRef, file);

  // 3. Get the download URL
  const url = await getDownloadURL(fileRef);

  // 4. Update the Firestore document for the user
  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, {
    profilePicture: url,
  });

  return url; // Return it if you want to use it immediately
};

export const deleteProfilePicture = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const fileRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);

  try {
    // Delete from storage
    await deleteObject(fileRef);

    // Remove the profilePicture field from Firestore
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      profilePicture: "", // or use deleteField() if you want to remove the field entirely
    });

    return true;
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    throw error;
  }
};

export const updateProfilePicture = async (file) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const fileRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);

  // Overwrite the file
  await uploadBytes(fileRef, file);

  // Get new download URL
  const downloadURL = await getDownloadURL(fileRef);

  // Update Firestore
  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, {
    profilePicture: downloadURL,
  });

  return downloadURL;
};

export const getUserProfilePicture = async (uid) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().profilePicture || null;
  } else {
    throw new Error("User not found");
  }
};