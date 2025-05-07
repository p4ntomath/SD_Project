
import React, { useState, useEffect } from 'react';
import '../styling/myProfilePage.css';
import accountIcon from '../assets/accountIcon.png';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../backend/firebase/firebaseConfig';
import handleImageUpload from '../components/HandleImageUpload';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";



export default function MyProfilePage() {

  const storage = getStorage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
    photoURL: '',
  });

  const [draftData, setDraftData] = useState({ ...formData });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const updated = {
              name: userData.fullName || '',
              email: userData.email || '',
              phone: user.phoneNumber || '',
              role: userData.role || '',
              bio: userData.bio || '',
              photoURL: userData.photoURL || '',
            };
            setFormData(updated);
            setDraftData(updated);

          } else {
            console.log("No user data found.");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData(draftData);
    alert('Profile updated!'); // replace with actual save logic later
  };

  // Converted JSX structure with Tailwind CSS
  return (
    <main className="flex flex-col min-h-screen bg-[#f3f4fc] font-segoe">
      <header className="bg-[#0c1f77] flex items-center p-[15pt_35pt] text-white">
        <button className="bg-none border-none text-[1.5rem] cursor-pointer">≡</button>
        <h1 className="ml-[15pt] text-[20pt] font-medium">My Profile</h1>
      </header>

      <section className="flex flex-wrap justify-between items-stretch flex-1 p-[32pt] gap-[32pt] min-h-[400px]">
        {/* Left Card */}
        <aside className="flex flex-col items-center text-center max-w-[500px] p-[32pt] bg-white rounded-[12px] shadow-md flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4"
          />
          <img
            src={formData.photoURL || accountIcon}
            alt="Profile Avatar"
            className="w-[155px] h-[150px] object-cover mb-[12pt]"
          />

          {formData.name && (
            <h1 className="text-xl font-bold mb-2">{formData.name}</h1>
          )}

          {formData.role && (
            <p className="italic text-black mb-[15pt]">
              {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
            </p>
          )}

          <section className="text-black text-[12pt]">
            {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
            {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
            <p><strong>Account Status:</strong> Active</p>
          </section>

          {formData.bio && (
            <div className="mt-4">
              <p className="text-black"><strong>Biography:</strong> {formData.bio}</p>
            </div>
          )}
        </aside>

        {/* Right Form */}
        <section className="flex flex-col bg-white rounded-[12px] shadow-md p-[32pt] min-w-[300px] flex-2">
          <h2 className="text-[23pt] font-bold mb-[60px]">Edit Your Information</h2>
          <form onSubmit={handleSubmit} className="flex flex-col font-medium text-black">
            <label className="flex flex-col mb-4">
              Name
              <input
                name="name"
                value={draftData.name}
                onChange={(e) => setDraftData({ ...draftData, name: e.target.value })}
                className="p-2 border border-gray-300 rounded-[8px] text-[12pt]"
              />
            </label>
            <label className="flex flex-col mb-4">
              Email
              <input
                name="email"
                type="email"
                value={draftData.email}
                onChange={(e) => setDraftData({ ...draftData, email: e.target.value })}
                className="p-2 border border-gray-300 rounded-[8px] text-[12pt]"
              />
            </label>
            <label className="flex flex-col mb-4">
              Phone
              <input
                name="phone"
                type="number"
                value={draftData.phone}
                onChange={(e) => setDraftData({ ...draftData, phone: e.target.value })}
                className="p-2 border border-gray-300 rounded-[8px] text-[12pt]"
              />
            </label>
            <label className="flex flex-col mb-6">
              Biography
              <textarea
                value={draftData.bio}
                onChange={(e) => setDraftData({ ...draftData, bio: e.target.value })}
                className="p-2 border border-gray-300 rounded-[8px] text-[12pt]"
              />
            </label>
            <button
              type="submit"
              className="bg-[#0c1f77] text-white font-bold p-2 rounded-[8px] hover:bg-[#0a1761]"
            >
              Save Changes
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

