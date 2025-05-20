import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const storage = getStorage();

/**
 * Uploads a document file to Firebase Storage and stores metadata in Firestore
 * @param {File} file - The file object from input
 * @param {string} projectId - The ID of the project this document is related to
 * @param {string} folderId - The ID of the folder to upload the document into
 * @param {Object} metadata - Optional metadata for the file
 * @returns {Promise<string>} - The document ID created in Firestore
 */
export const uploadDocument = async (file, projectId, folderId, metadata = {}) => {
  try {
    if (!file) throw new Error("No file provided");
    if (!projectId) throw new Error("Project ID is required");
    if (!folderId) throw new Error("Folder ID is required");

    if (!auth.currentUser) {
      throw new Error("You don't have permission");
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxFileSize) {
      throw new Error("File size exceeds the maximum limit of 10MB");
    }

    // Create a safe filename for storage while preserving custom name
    const fileExtension = file.name.split('.').pop();
    const safeFileName = `${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `projects/${projectId}/folders/${folderId}/${safeFileName}`);

    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create document reference in Firestore
    const projectRef = doc(db, "projects", projectId);
    const folderRef = doc(projectRef, "folders", folderId);
    const filesCollectionRef = collection(folderRef, "files");
    const docRef = doc(filesCollectionRef);

    // Store comprehensive file metadata in Firestore
    const fileMetadata = {
      documentId: docRef.id,
      fileName: file.name,
      displayName: metadata.displayName || file.name,
      storageFileName: safeFileName,
      downloadURL,
      uploadedAt: serverTimestamp(),
      lastModified: serverTimestamp(),
      size: file.size,
      type: file.type,
      description: metadata.description || '',
      uploadedBy: auth.currentUser?.uid,
      folderId: folderId,
      projectId: projectId
    };

    await setDoc(docRef, fileMetadata);

    // Update folder's total size
    const folderSnap = await getDoc(folderRef);
    if (folderSnap.exists()) {
      const folderData = folderSnap.data();
      const currentSize = folderData.size || 0;
      await updateDoc(folderRef, {
        size: currentSize + file.size,
        updatedAt: serverTimestamp()
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error("Failed to upload document: " + error.message);
  }
};

/**
 * Fetch documents by projectId
 * @param {string} projectId - The ID of the project
 * @returns {Promise<Array>} - List of folders and their documents associated with the project
 */
export const fetchDocumentsByFolder = async (projectId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // First check if user has access to this project
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error("Project not found");

    const projectData = projectSnap.data();
    
    // Check if user is owner, reviewer, or collaborator
    const isOwner = projectData.userId === user.uid;
    const isInReviewersArray = projectData.reviewers?.some(rev => rev.id === user.uid);
    const isCollaborator = projectData.collaborators?.some(collab => collab.id === user.uid);

    if (!isOwner && !isInReviewersArray && !isCollaborator) {
      throw new Error("You don't have permission to access this project's documents");
    }

    // Get all folders in the project
    const foldersRef = collection(projectRef, "folders");
    const folderSnapshot = await getDocs(foldersRef);
    
    if (folderSnapshot.empty) {
      return [];
    }

    const folders = await Promise.all(
      folderSnapshot.docs.map(async (folderDoc) => {
        const folderData = folderDoc.data();
        const filesRef = collection(folderDoc.ref, "files");
        const fileSnapshot = await getDocs(filesRef);
        
        const files = fileSnapshot.docs.map(doc => {
          const fileData = doc.data();
          return {
            id: doc.id,
            documentId: doc.id,
            name: fileData.displayName || fileData.fileName,
            fileName: fileData.fileName,
            description: fileData.description || '',
            downloadURL: fileData.downloadURL,
            size: fileData.size || 0, // Keep raw byte size
            type: fileData.type || 'Unknown type',
            uploadDate: fileData.uploadedAt,
            lastModified: fileData.lastModified
          };
        });

        return {
          id: folderDoc.id,
          name: folderData.name,
          createdAt: folderData.createdAt,
          size: folderData.size || 0, // Keep raw byte size
          files: files || [] // Ensure files is always an array
        };
      })
    );

    return folders;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

/**
 * Re-upload a document (update its metadata in Firestore and re-upload the file)
 * @param {File} file - The new file object
 * @param {string} documentId - The ID of the document to update
 * @param {string} projectId - The project ID the document belongs to
 * @param {string} folderId - The folder ID the document belongs to
 * @returns {Promise<string>} - The document ID
 */
export const reuploadDocument = async (file, documentId, projectId, folderId) => {
  try {
    if (!file) throw new Error("No file provided");

    const folderPath = `projects/${projectId}/folders/${folderId}/`;
    const storageRef = ref(storage, `${folderPath}${file.name}`);
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);
    
    const projectRef = doc(db, "projects", projectId);
    const folderRef = doc(projectRef, "folders", folderId);
    const filesCollectionRef = collection(folderRef, "files");
    const docRef = doc(filesCollectionRef, documentId);

    const metadata = {
      fileName: file.name,
      downloadURL,
      uploadedAt: serverTimestamp(),
    };

    await updateDoc(docRef, metadata);
    return documentId;
  } catch (error) {
    throw new Error("Failed to re-upload document: " + error.message);
  }
};

/**
 * Delete a document from Firebase Storage and Firestore
 * @param {string} documentId - The ID of the document to delete
 * @param {string} projectId - The ID of the project this document belongs to
 * @param {string} folderId - The folder ID the document belongs to
 * @returns {Promise<boolean>} - Returns true if document was deleted successfully
 */
export const deleteDocument = async (documentId, projectId, folderId) => {
  try {
    const folderRef = doc(db, "projects", projectId, "folders", folderId);
    const filesCollectionRef = collection(folderRef, "files");
    const docRef = doc(filesCollectionRef, documentId);

    const docSnap = await getDoc(docRef);  // Fetch the document
    if (!docSnap.exists()) throw new Error("Document not found");

    const data = docSnap.data();
    // Use storageFileName instead of fileName for deletion
    const fileRef = ref(storage, `projects/${projectId}/folders/${folderId}/${data.storageFileName}`);

    try {
      await deleteObject(fileRef);  // Delete the file from Firebase Storage
    } catch (storageError) {
      // Storage file might already be deleted or not exist, continue with document deletion
    }
    
    // Update folder's total size before deleting the document
    const folderSnap = await getDoc(folderRef);
    if (folderSnap.exists()) {
      const folderData = folderSnap.data();
      const currentSize = folderData.size || 0;
      const newSize = Math.max(0, currentSize - (data.size || 0)); // Ensure size doesn't go negative
      await updateDoc(folderRef, {
        size: newSize,
        updatedAt: serverTimestamp()
      });
    }

    await deleteDoc(docRef);  // Delete the document from Firestore
    return true;
  } catch (error) {
    throw new Error("Failed to delete document: " + error.message);
  }
};

/**
 * Helper function to download document from its URL
 * @param {string} downloadURL - The URL to the document to download
 */
const downloadDocument = (downloadURL) => {
    try {
      const a = document.createElement("a");
      a.href = downloadURL;
      a.target = "_blank";
      a.download = "";
      a.click();
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document.");
    }
};

/**
 * Fetches all documents across all projects
 * @returns {Promise<Array>} Array of all documents across all projects
 */
export const fetchAllDocuments = async () => {
    try {
        const projectsRef = collection(db, "projects");
        const projectsSnapshot = await getDocs(projectsRef);
        
        const allDocuments = [];

        // Loop through each project
        for (const projectDoc of projectsSnapshot.docs) {
            const projectId = projectDoc.id;
            const foldersRef = collection(projectDoc.ref, "folders");
            const foldersSnapshot = await getDocs(foldersRef);
            
            // Loop through each folder in the project
            for (const folderDoc of foldersSnapshot.docs) {
                const filesRef = collection(folderDoc.ref, "files");
                const filesSnapshot = await getDocs(filesRef);
                
                // Add each file to our array with project and folder context
                filesSnapshot.docs.forEach(fileDoc => {
                    const fileData = fileDoc.data();
                    allDocuments.push({
                        id: fileDoc.id,
                        projectId: projectId,
                        folderId: folderDoc.id,
                        folderName: folderDoc.data().name,
                        fileName: fileData.displayName || fileData.fileName,
                        description: fileData.description || '',
                        downloadURL: fileData.downloadURL,
                        size: fileData.size,
                        type: fileData.type,
                        uploadedAt: fileData.uploadedAt,
                        lastModified: fileData.lastModified
                    });
                });
            }
        }

        return allDocuments;
    } catch (error) {
        console.error("Error fetching all documents:", error);
        throw new Error("Failed to fetch all documents");
    }
};
