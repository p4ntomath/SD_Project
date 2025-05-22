import React, { useState, useEffect } from 'react';
import { auth, db } from '../backend/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { uploadUserProfilePicture, updateUserProfile, deleteProfilePicture } from '../backend/firebase/viewprofile';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../components/CropImage';
import accountIcon from '../assets/accountIcon.png';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { getStorage } from 'firebase/storage';
import { FiMenu, FiX } from 'react-icons/fi';
import ReviewerMainNav from '../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';

export default function MyProfilePage() {
  const storage = getStorage();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    researchField: '',
    photoURL: '',
    joined: '',
    institution: ''
  });
  const [draftData, setDraftData] = useState({ ...formData });
  const [previewURL, setPreviewURL] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [openCropModal, setOpenCropModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial profile data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const joinDate = user.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
              : '';

            const profileData = {
              name: userData.fullName || '',
              role: userData.role || '',
              bio: userData.bio || '',
              researchField: userData.researchField || '',
              photoURL: userData.profilePicture || '',
              joined: joinDate,
              institution: userData.institution || ''
            };

            setFormData(profileData);
            setDraftData(profileData);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result);
        setOpenCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePicture = async () => {
    try {
      setIsDeleting(true);
      await deleteProfilePicture();

      setPreviewURL('');
      setDraftData(prev => ({ ...prev, photoURL: '' }));
      setFormData(prev => ({ ...prev, photoURL: '' }));
      setShowPhotoModal(false); // close modal
    } catch (err) {
      console.error("Failed to delete picture:", err);
      alert("Failed to delete profile picture");
    } finally {
      setIsDeleting(false);
    }
  };

  const onCropComplete = (_, area) => {
    setCroppedAreaPixels(area);
  };

  const handleCropDone = async () => {
    if (!croppedAreaPixels || !selectedFile) return;
    try {
      setIsLoading(true);
      const croppedImg = await getCroppedImg(selectedFile, croppedAreaPixels);
      // Convert base64 cropped image to Blob
      let blob;
      try {
        const response = await fetch(croppedImg);
        blob = await response.blob();
      } catch (err) {
        console.error("⚠️ Failed to fetch cropped blob:", err);
        alert("Image processing failed.");
        return;
      }
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

      //  Compress before upload
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      // Upload compressed file
      const downloadURL = await uploadUserProfilePicture(compressedFile);

      setPreviewURL(downloadURL);
      setDraftData(prev => ({ ...prev, photoURL: downloadURL }));
      setOpenCropModal(false);

    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        fullName: draftData.name,
        bio: draftData.bio,
        researchField: draftData.researchField,
        institution: draftData.institution,
        profilePicture: draftData.photoURL || null
      });


      setFormData(draftData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile: ' + error.message);
    }
  };

  return (
    <>
      {draftData.role.charAt(0).toUpperCase() + draftData.role.slice(1) === 'Reviewer' ? (
        <ReviewerMainNav />
      ) : (
        <MainNav
          setMobileMenuOpen={setMobileMenuOpen}
          mobileMenuOpen={mobileMenuOpen} />
      )}
      <main className="min-h-screen bg-gray-100 p-8">

        <header className="relative flex items-center gap-5 mb-7 ml-12">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto min-h-[700px]">

          <aside className="bg-white p-6 rounded-2xl shadow flex flex-col items-center  mb-10">
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Only wrap the image in the button */}
            <button
              type="button"
              onClick={() => document.getElementById('profile-image-input').click()}
              className="focus:outline-none mb-4"
              title="Click to upload new profile image"
            >
              <img
                src={previewURL || draftData.photoURL || accountIcon}
                alt="Profile Avatar"
                className="w-40 h-40 rounded-full object-cover border-4 border-gray-300 hover:opacity-90"
              />
            </button>

            {(draftData.photoURL || previewURL) && (
              <section className="mt-2 text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="text-blue-600 underline text-sm"
                >
                  Edit Photo
                </button>


                {showPhotoOptions && (
                  <fieldset id="photo-options" className="mt-1 space-y-1 border-0">
                    <legend className="sr-only">Photo options</legend>

                    <label
                      htmlFor="change-photo"
                      className="block cursor-pointer text-blue-600 hover:underline"
                    >
                      Change Photo
                    </label>
                    <input
                      type="file"
                      id="change-photo"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    <button
                      type="button"
                      onClick={handleDeletePicture}
                      className="text-red-600 hover:underline"
                    >
                      Delete Photo
                    </button>
                  </fieldset>
                )}
              </section>
            )}

            <h1 className="text-xl font-bold mt-2 mb-2">{draftData.name}</h1>
            <p className="text-gray-600 mb-4">
              {draftData.role.charAt(0).toUpperCase() + draftData.role.slice(1)}
            </p>
            <section className="text-center w-full text-sm text-gray-800 space-y-4">
              <section aria-labelledby="joined-label">
                <h2 id="joined-label" className="font-bold">Date joined</h2>
                <p>{formData.joined}</p>
              </section>
              <section aria-labelledby="institution-label">
                <h2 id="institution-label" className="font-bold">Institution/Department</h2>
                <p>{draftData.institution}</p>
              </section>

              {draftData.role.charAt(0).toUpperCase() + draftData.role.slice(1) === 'Researcher' && (
                <>
                  <section aria-labelledby="research-field-label">
                    <h2 id="research-field-label" className="font-bold">Research Field</h2>
                    <p>{draftData.researchField}</p>
                  </section>
                </>
              )}
              <section aria-labelledby="bio-label">
                <h2 id="bio-label" className="font-bold">Biography</h2>
                <p>{draftData.bio}</p>
              </section>
            </section>
          </aside>


          <section className="bg-white p-6 rounded-2xl shadow mb-10">
            <h2 className="text-xl font-bold mb-6">Edit Your Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset>
                <legend className="sr-only">Edit your profile</legend>

                <label htmlFor="name" className="block text-sm font-semibold mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={draftData.name}
                  onChange={(e) => setDraftData({ ...draftData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />

                <label htmlFor="institution" className="block text-sm font-semibold mb-1 mt-4">Institution/Department</label>
                <input
                  id="institution"
                  type="text"
                  name="institution"
                  value={draftData.institution}
                  onChange={(e) => setDraftData({ ...draftData, institution: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                {draftData.role.charAt(0).toUpperCase() + draftData.role.slice(1) === 'Researcher' && (
                  <>
                    <label htmlFor="researchField" className="block text-sm font-semibold mb-1 mt-4">Research Field</label>
                    <input
                      id="researchField"
                      type="text"
                      name="researchField"
                      value={draftData.researchField}
                      onChange={(e) => setDraftData({ ...draftData, researchField: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </>
                )}

                <label htmlFor="bio" className="block text-sm font-semibold mb-1 mt-4">Biography</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={draftData.bio}
                  onChange={(e) => setDraftData({ ...draftData, bio: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded h-24"
                ></textarea>
              </fieldset>

              <button
                type="submit"
                className="w-full bg-blue-700 text-white font-semibold py-2 rounded hover:bg-blue-800"
              >
                Save Changes
              </button>
            </form>
          </section>
        </section>


        {openCropModal && selectedFile && (
          <dialog open className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <section className="bg-white rounded-xl p-6 w-[90vw] max-w-[500px] shadow-lg max-h-[90vh] overflow-y-auto">
              <header className="mb-4"><h2 className="text-xl font-bold text-center">Crop your profile photo</h2></header>
              <section className="relative h-[400px] sm:h-[500px] mb-6">
                <Cropper image={selectedFile} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
              </section>
              <footer className="flex justify-end gap-2">
                <button onClick={() => setOpenCropModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button onClick={handleCropDone} className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded hover:bg-blue-800">Crop & Save</button>
              </footer>
            </section>
          </dialog>
        )}
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/30 flex items-center justify-center">
            <section className="bg-white p-6 rounded-lg shadow-md w-80 space-y-4">
              <h2 className="text-lg font-semibold">Edit Profile Photo</h2>

              <div className="space-y-3">
                <label
                  htmlFor="change-photo"
                  className="block cursor-pointer text-blue-600 hover:underline"
                >
                  Change Photo
                </label>
                <input
                  type="file"
                  id="change-photo"
                  className="hidden"
                  onChange={(e) => {
                    handleImageChange(e);
                    setShowPhotoModal(false);
                  }}
                />

                <button
                  type="button"
                  onClick={handleDeletePicture}
                  disabled={isDeleting}
                  className={`text-red-600 hover:underline ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Photo'}
                </button>

              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        )}


      </main>

      <footer className="md:hidden">
        {draftData.role.charAt(0).toUpperCase() + draftData.role.slice(1) === 'Reviewer' ? (
          <ReviewerMobileBottomNav />
        ) : (
          <MobileBottomNav />
        )}
      </footer>
    </>
  );
}