import React, { useState, useEffect } from 'react';
import { auth, db } from '../backend/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { uploadUserProfilePicture, updateUserProfile, deleteProfilePicture } from '../backend/firebase/viewprofile';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import getCroppedImg from '../components/CropImage';
import accountIcon from '../assets/accountIcon.png';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { getStorage } from 'firebase/storage';
import { FiMenu, FiX } from 'react-icons/fi';
import ReviewerMainNav from '../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';
import { ClipLoader } from 'react-spinners';
import Select from 'react-select';
import { fetchUniversities } from '../utils/universityOptions';

export default function MyProfilePage() {
  const storage = getStorage();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    researchField: '',
    photoURL: '',
    joined: '',
    institution: '',
    department: ''
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
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [isCropping, setIsCropping] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

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
              researchField: userData.fieldOfResearch || '',
              photoURL: userData.profilePicture || '',
              joined: joinDate,
              institution: userData.institution || '',
              department: userData.department || ''
            };

            setFormData(profileData);
            setDraftData(profileData);
            setSelectedInstitution({ value: userData.institution, label: userData.institution });
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

  useEffect(() => {
    const loadUniversities = async () => {
      const uniOptions = await fetchUniversities();
      setUniversities(uniOptions);
    };

    loadUniversities();
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
      setShowPhotoModal(false);
      setStatusMessage({ type: 'success', message: 'Profile picture deleted successfully!' });
      setShowStatusModal(true);
    } catch (err) {
      console.error("Failed to delete picture:", err);
      setStatusMessage({ type: 'error', message: 'Failed to delete profile picture' });
      setShowStatusModal(true);
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
      setIsCropping(true);
      const croppedImg = await getCroppedImg(selectedFile, croppedAreaPixels);
      
      let blob;
      try {
        const response = await fetch(croppedImg);
        blob = await response.blob();
      } catch (err) {
        console.error("Failed to fetch cropped blob:", err);
        setStatusMessage({ type: 'error', message: 'Image processing failed' });
        setShowStatusModal(true);
        return;
      }
      
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const downloadURL = await uploadUserProfilePicture(compressedFile);

      setPreviewURL(downloadURL);
      setDraftData(prev => ({ ...prev, photoURL: downloadURL }));
      setOpenCropModal(false);
      setStatusMessage({ type: 'success', message: 'Profile picture updated successfully!' });
      setShowStatusModal(true);
    } catch (error) {
      console.error('Image upload failed:', error);
      setStatusMessage({ type: 'error', message: 'Failed to upload profile picture' });
      setShowStatusModal(true);
    } finally {
      setIsCropping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any changes were made
    const hasChanges = Object.keys(draftData).some(key => 
      JSON.stringify(draftData[key]) !== JSON.stringify(formData[key])
    );

    if (!hasChanges) {
      setStatusMessage({ type: 'info', message: 'No changes to save' });
      setShowStatusModal(true);
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        fullName: draftData.name,
        bio: draftData.bio,
        fieldOfResearch: draftData.researchField,
        institution: draftData.institution,
        department: draftData.department,
        profilePicture: draftData.photoURL || null
      });

      setFormData(draftData);
      setStatusMessage({ type: 'success', message: 'Profile updated successfully!' });
      setShowStatusModal(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      setStatusMessage({ type: 'error', message: 'Failed to update profile: ' + error.message });
      setShowStatusModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
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

            <button
              type="button"
              onClick={() => document.getElementById('profile-image-input').click()}
              className="focus:outline-none mb-4"
              title="Click to upload new profile image"
            >
              {previewURL || draftData.photoURL ? (
                <img
                  src={previewURL || draftData.photoURL}
                  alt="Profile Avatar"
                  className="w-40 h-40 rounded-full object-cover border-4 border-gray-300 hover:opacity-90"
                />
              ) : (
                <div className="w-40 h-40 rounded-full flex items-center justify-center text-3xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors border-4 border-gray-300">
                  {getAvatarInitials(draftData.name)}
                </div>
              )}
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
                <h2 id="institution-label" className="font-bold">Institution</h2>
                <p>{draftData.institution}</p>
              </section>
              <section aria-labelledby="department-label">
                <h2 id="department-label" className="font-bold">Department</h2>
                <p>{draftData.department}</p>
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

                <label htmlFor="institution" className="block text-sm font-semibold mb-1 mt-4">Institution</label>
                <Select
                  id="institution"
                  name="institution"
                  value={selectedInstitution}
                  onChange={(option) => {
                    setSelectedInstitution(option);
                    setDraftData({ ...draftData, institution: option.value });
                  }}
                  options={universities}
                  classNamePrefix="react-select"
                  className="react-select-container"
                  isClearable
                  placeholder="Select your institution"
                />

                <label htmlFor="department" className="block text-sm font-semibold mb-1 mt-4">Department</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={draftData.department}
                  onChange={(e) => setDraftData({ ...draftData, department: e.target.value })}
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
                disabled={isSaving}
                className="w-full bg-blue-700 text-white font-semibold py-2 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <ClipLoader color="#ffffff" size={20} className="mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </section>
        </section>


        {/* Photo Crop Modal */}
        {openCropModal && selectedFile && (
          <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-[9999] h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-[95vw] max-w-[800px] shadow-lg">
                <header className="mb-4">
                  <h2 className="text-xl font-bold text-center">Crop your profile photo</h2>
                </header>
                <div className="relative w-full h-[400px]">
                  <Cropper 
                    image={selectedFile}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    style={{
                      containerStyle: {
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#ffffff"
                      }
                    }}
                  />
                </div>
                <footer className="flex justify-end gap-2 mt-4">
                  <button 
                    onClick={() => setOpenCropModal(false)} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={isCropping}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCropDone}
                    disabled={isCropping} 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isCropping ? (
                      <>
                        <ClipLoader color="#ffffff" size={16} className="mr-2" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      'Crop & Save'
                    )}
                  </button>
                </footer>
              </div>
            </div>
          </div>
        )}
        {/* Photo Edit Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/30 flex items-center justify-center">
            <section className="bg-white p-6 rounded-lg shadow-md w-[110vw] max-w-[500px] space-y-4">
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

        {/* Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/30 flex items-center justify-center">
            <section className="bg-white p-6 rounded-lg shadow-md w-[95vw] max-w-[500px] space-y-4">
              <h2 className={`text-lg font-semibold ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {statusMessage.type === 'success' ? 'Success!' : 'Error'}
              </h2>
              <p className="text-gray-600">{statusMessage.message}</p>
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
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