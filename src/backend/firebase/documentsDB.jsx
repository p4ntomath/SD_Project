import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const storage = getStorage();

/**
 * Uploads a document file to Firebase Storage and stores metadata in Firestore
 * @param {File} file - The file object from input
 * @param {string} projectId - The ID of the project this document is related to
 * @param {string} folderId - The ID of the folder to upload the document into
 * @returns {Promise<string>} - The document ID created in Firestore
 */
export const uploadDocument = async (file, projectId, folderId) => {
    try {
      if (!file) throw new Error("No file provided");

      const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxFileSize) {
        throw new Error("File size exceeds the maximum limit of 10MB");
      }

      const folderPath = `projects/${projectId}/folders/${folderId}/`;  
      const storageRef = ref(storage, `${folderPath}${file.name}`);

      await uploadBytes(storageRef, file);
  
      const downloadURL = await getDownloadURL(storageRef);
      const projectRef = doc(db, "projects", projectId);
      const folderRef = doc(projectRef, "folders", folderId);
      const filesCollectionRef = collection(folderRef, "files");
      const docRef = doc(filesCollectionRef);

      await setDoc(docRef, {
        fileName: file.name,
        downloadURL,
        uploadedAt: serverTimestamp(),
        documentId: docRef.id,
        folderId, // Optional metadata
      });

      return docRef.id;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new Error("Failed to upload document");
    }
};

/**
 * Fetch documents by projectId and folderId
 * @param {string} projectId - The ID of the project
 * @param {string} folderId - The ID of the folder
 * @returns {Promise<Array>} - List of documents associated with the project and folder
 */
export const fetchDocumentsByFolder = async (projectId, folderId) => {
  try {
    const folderRef = doc(db, "projects", projectId, "folders", folderId); // Reference to the folder document
    const filesCollectionRef = collection(folderRef, "files"); // Sub-collection 'files' inside each folder

    const snapshot = await getDocs(filesCollectionRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new Error("Failed to fetch documents");
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
export const reuploadDocument = async (file, documentId, projectId, folderId) => {// this is for updating documents
    try {
      if (!file) throw new Error("No file provided");

      const folderPath = `projects/${projectId}/folders/${folderId}/`;  // Folder for each project
      const storageRef = ref(storage, `${folderPath}${file.name}`);
      await uploadBytes(storageRef, file);
  
      const downloadURL = await getDownloadURL(storageRef);
      const projectRef = doc(db, "projects", projectId);
      const folderRef = doc(projectRef, "folders", folderId);
      const filesCollectionRef = collection(folderRef, "files");
      const docRef = doc(filesCollectionRef, documentId); // Reference to the existing document
  
      await updateDoc(docRef, {
        fileName: file.name,
        downloadURL,
        uploadedAt: serverTimestamp(),
      });

      return documentId;
    } catch (error) {
      console.error("Error re-uploading document:", error);
      throw new Error("Failed to re-upload document");
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
      const fileRef = ref(storage, `projects/${projectId}/folders/${folderId}/${data.fileName}`);

      await deleteObject(fileRef);  // Delete the file from Firebase Storage
      await deleteDoc(docRef);  // Delete the document from Firestore
  
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw new Error("Failed to delete document");
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
