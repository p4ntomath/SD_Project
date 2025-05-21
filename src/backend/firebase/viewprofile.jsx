
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
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const fileRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);

  // Overwrite the file
  await uploadBytes(fileRef, file);


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