import React, { useState, useEffect } from 'react';
import accountIcon from '../assets/accountIcon.png';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../backend/firebase/firebaseConfig';
import handleImageUpload from '../components/HandleImageUpload';
import { getStorage } from "firebase/storage";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../components/CropImage';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FaChevronDown, FaEllipsisV, FaEnvelope } from 'react-icons/fa';


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

  const onCropComplete = (_, area) => {
    setCroppedAreaPixels(area);
  };

  const handleCropDone = async () => {
    if (!croppedAreaPixels || !selectedFile) return;
    try {
      const croppedImg = await getCroppedImg(selectedFile, croppedAreaPixels);
      setPreviewURL(croppedImg);
      setDraftData(prev => ({ ...prev, photoURL: croppedImg }));
      setOpenCropModal(false);
    } catch (err) {
      console.error('Crop failed:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const joinDate = user.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '';
            const updated = {
              name: userData.fullName || '',
              role: userData.role || 'Researcher',
              bio: userData.bio || '',
              researchField: userData.researchField || '',
              photoURL: userData.photoURL || '',
              joined: joinDate,
              institution: userData.institution || ''
            };
            setFormData(updated);
            setDraftData(updated);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData(draftData);
    alert('Profile updated!');
  };


  return (
    <>
      <MainNav />
      <main className="min-h-screen bg-gray-100 p-8">

        <header className="relative flex items-center gap-5 mb-7 ml-17">
          <nav className="relative" aria-label="User navigation">
            <button
              onClick={() => setOpen(!open)}
              className="text-black"
              aria-expanded={open}
              aria-haspopup="true"
              aria-label="Open user menu"
            >
              {/* Arrow for md and up */}
              <FaChevronDown
                className={`transition-transform duration-300 ${open ? 'rotate-180' : ''} hidden md:inline`}
              />

              <FaEllipsisV
                onClick={() => setOpen(!open)}
                className="md:hidden text-black text-xl cursor-pointer"
                aria-label="Open user menu"
              />


            </button>

            {open && (
              <ul
                className="absolute left-0 top-8 w-48 bg-gray-800 text-white rounded-lg shadow-lg p-2 z-50"
                role="menu"
              >
                <li><button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded" role="menuitem">My Profile</button></li>
                <li><button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded" role="menuitem">Settings</button></li>
                <li><button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded" role="menuitem">Help</button></li>
              </ul>
            )}
          </nav>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto min-h-[600px]">
          <aside className="bg-white p-6 rounded-2xl shadow flex flex-col items-center">
            <input id="profile-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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
            <h1 className="text-xl font-bold mt-2 mb-2">{formData.name}</h1>
            <p className="text-gray-600 mb-4">
              {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
            </p>
            <section className="text-center w-full text-sm text-gray-800 space-y-4">

              <section aria-labelledby="joined-label">
                <h2 id="joined-label" className="font-bold">Date joined</h2>
                <p>{formData.joined}</p>
              </section>

              <section aria-labelledby="institution-label">
                <h2 id="institution-label" className="font-bold">Institution/Department</h2>
                <p>{formData.institution}</p>
              </section>

              <section aria-labelledby="research-field-label">
                <h2 id="research-field-label" className="font-bold">Research Field</h2>
                <p>{formData.researchField}</p>
              </section>

              <section aria-labelledby="bio-label">
                <h2 id="bio-label" className="font-bold">Biography</h2>
                <p>{formData.bio}</p>
              </section>
            </section>

          </aside>

          <section className="bg-white p-6 rounded-2xl shadow">
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

                <label htmlFor="researchField" className="block text-sm font-semibold mb-1 mt-4">Research Field</label>
                <input
                  id="researchField"
                  type="text"
                  name="researchField"
                  value={draftData.researchField}
                  onChange={(e) => setDraftData({ ...draftData, researchField: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />

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
      </main>
      <footer className="md:hidden">
        <MobileBottomNav />
      </footer>
    </>
  );
} 