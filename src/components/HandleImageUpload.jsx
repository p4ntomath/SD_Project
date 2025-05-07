const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const user = auth.currentUser;
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
  
      // Upload image to Firebase Storage
      await uploadBytes(storageRef, file);
  
      // Get image URL
      const downloadURL = await getDownloadURL(storageRef);
  
      // Save image URL to Firestore
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { photoURL: downloadURL });
  
      // Update local state
      setFormData((prev) => ({ ...prev, photoURL: downloadURL }));
      setDraftData((prev) => ({ ...prev, photoURL: downloadURL }));
  
    } catch (error) {
      console.error("Image upload failed:", error);
    }
  };
  
  export default handleImageUpload;