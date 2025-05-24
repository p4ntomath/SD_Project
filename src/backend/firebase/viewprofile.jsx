import { auth, db, storage } from "./firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, /*deleteField*/ } from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadUserProfilePicture = async (file) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");


  const fileRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);


  await uploadBytes(fileRef, file);


  const url = await getDownloadURL(fileRef);


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
    await deleteObject(fileRef);
  } catch (error) {
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  }

  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, {
    profilePicture: "",
  });

  return true;
};

export const updateProfilePicture = async (file) => {
  return await saveUserProfilePicture(file);
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

export const getUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data(); // You can destructure specific fields if needed
  } else {
    throw new Error("User profile not found");
  }
};

export const updateUserProfile = async (profileData) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, profileData);

  return true;
};

export const deleteUserProfileFields = async (fieldsToDelete) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const userRef = doc(db, "users", user.uid);

  const updates = {};
  for (const field of fieldsToDelete) {
    updates[field] = deleteField();
  }

  await updateDoc(userRef, updates);
  return true;
};

export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm) return [];

    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    // Filter and map users locally for flexible search
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.institution?.toLowerCase().includes(searchLower) ||
          user.department?.toLowerCase().includes(searchLower) ||
          user.fieldOfResearch?.toLowerCase().includes(searchLower)
        );
      });
  } catch (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }
};

export const getPublicProfile = async (userId) => {
  if (!userId) throw new Error("User ID is required");

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    return {
      id: userSnap.id,
      fullName: userData.fullName,
      role: userData.role,
      institution: userData.institution,
      department: userData.department,
      fieldOfResearch: userData.fieldOfResearch,
      bio: userData.bio,
      profilePicture: userData.profilePicture,
      createdAt: userData.createdAt
    };
  } else {
    throw new Error("User not found");
  }
};