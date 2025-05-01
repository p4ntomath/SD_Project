import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const storage = getStorage();

/**
 * Uploads a document file to Firebase Storage and stores metadata in Firestore
 * @param {File} file - The file object from input
 * @param {string} projectId - The ID of the project this document is related to
 * @returns {Promise<string>} - The document ID created in Firestore
 */

export const uploadDocument = async (file, projectId) => {
    try {
      if (!file) throw new Error("No file provided");
  
      const storageRef = ref(storage, `project_documents/${projectId}/${file.name}`);
      await uploadBytes(storageRef, file);
  
      const downloadURL = await getDownloadURL(storageRef);
  
      const docRef = doc(collection(db, "documents"));
      await setDoc(docRef, {
        fileName: file.name,
        downloadURL,
        projectId,
        uploadedAt: serverTimestamp(),
        documentId: docRef.id,
      });
  
      return docRef.id;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new Error("Failed to upload document");
    }
  };

  export const fetchDocumentsByProject = async (projectId) => {
    try {
      const docsRef = collection(db, "documents");
      const q = query(docsRef, where("projectId", "==", projectId));
      const querySnapshot = await getDocs(q);
  
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw new Error("Failed to fetch documents");
    }
  };


  export const reuploadDocument = async (file, documentId, projectId) => {// this is for updating documents
    try {
      if (!file) throw new Error("No file provided");
  
      const storageRef = ref(storage, `project_documents/${projectId}/${file.name}`);
      await uploadBytes(storageRef, file);
  
      const downloadURL = await getDownloadURL(storageRef);
      const docRef = doc(db, "documents", documentId);
  
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

  export const deleteDocument = async (documentId) => {
    try {
      const docRef = doc(db, "documents", documentId);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) throw new Error("Document not found");
  
      const data = docSnap.data();
      const fileRef = ref(storage, `project_documents/${data.projectId}/${data.fileName}`);
  
      await deleteObject(fileRef);
      await deleteDoc(docRef);
  
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw new Error("Failed to delete document");
    }
  };

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