import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { deleteDocument } from "./documentsDB";

/**
 * Creates a new folder in a project
 * @param {string} projectId - The ID of the project
 * @param {string} folderName - The name of the folder
 * @returns {Promise<string>} - The folder ID
 */
export const createFolder = async (projectId, folderName) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        
        // Validate inputs
        if (!projectId) throw new Error("Project ID is required");
        if (!folderName?.trim()) throw new Error("Folder name is required");

        // Create folder reference
        const projectRef = doc(db, "projects", projectId);
        const foldersCollectionRef = collection(projectRef, "folders");
        const folderRef = doc(foldersCollectionRef);

        // Create folder document with initialized size
        await setDoc(folderRef, {
            name: folderName.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            projectId: projectId,
            folderId: folderRef.id,
            size: 0 // Initialize size to 0
        });

        return folderRef.id;
    } catch (error) {
       
        throw new Error("Failed to create folder: " + error.message);
    }
};

/**
 * Updates a folder's name
 * @param {string} projectId - The ID of the project
 * @param {string} folderId - The ID of the folder
 * @param {string} newName - The new name for the folder
 */
export const updateFolderName = async (projectId, folderId, newName) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        if (!newName?.trim()) throw new Error("New folder name is required");

        const folderRef = doc(db, "projects", projectId, "folders", folderId);
        const folderSnap = await getDoc(folderRef);

        if (!folderSnap.exists()) {
            throw new Error("Folder not found");
        }

        await updateDoc(folderRef, {
            name: newName.trim(),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating folder name:", error);
        throw new Error("Failed to update folder name: " + error.message);
    }
};

/**
 * Deletes a folder and all its contents
 * @param {string} projectId - The ID of the project
 * @param {string} folderId - The ID of the folder to delete
 */
export const deleteFolder = async (projectId, folderId) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const folderRef = doc(db, "projects", projectId, "folders", folderId);
        const folderSnap = await getDoc(folderRef);

        if (!folderSnap.exists()) {
            throw new Error("Folder not found");
        }

        // First delete all files in the folder
        const filesRef = collection(folderRef, "files");
        const filesSnap = await getDocs(filesRef);
        
        // Delete each file
        await Promise.all(filesSnap.docs.map(fileDoc => 
            deleteDocument(fileDoc.id, projectId, folderId)
        ));

        // Then delete the folder itself
        await deleteDoc(folderRef);
    } catch (error) {
        console.error("Error deleting folder:", error);
        throw new Error("Failed to delete folder: " + error.message);
    }
};

/**
 * Fetches all folders in a project
 * @param {string} projectId - The ID of the project
 * @returns {Promise<Array>} - List of folders
 */
export const getFolders = async (projectId) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const foldersRef = collection(db, "projects", projectId, "folders");
        const folderSnapshot = await getDocs(foldersRef);
        
        return folderSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching folders:", error);
        throw new Error("Failed to fetch folders: " + error.message);
    }
};