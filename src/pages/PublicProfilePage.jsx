import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../backend/firebase/firebaseConfig';
import { ClipLoader } from 'react-spinners';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FiUser, FiBookOpen, FiAward, FiTarget, FiClock, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
          // Fetch user's projects if they're a researcher
          if (userDoc.data().role?.toLowerCase() === 'researcher') {
            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, where('researcherId', '==', userId));
            const projectsSnap = await getDocs(q);
            setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ClipLoader color="#0a66c2" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Profile not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Profile Header Card */}
        <div className="relative mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-sky-100 opacity-30 rounded-3xl"></div>
          
          {/* Glass Effect Container */}
          <div className="relative backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl overflow-hidden border border-white/20">
            {/* Profile Content */}
            <div className="flex flex-col items-center p-8">
              {/* Profile Picture */}
              <div className="relative group mb-6">
                {user.profilePicture ? (
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-sky-500 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform"></div>
                    <img
                      src={user.profilePicture}
                      alt={user.fullName}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl border-4 border-white shadow-xl transform group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-sky-500 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                      <span className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-sky-500 text-transparent bg-clip-text">
                        {getAvatarInitials(user.fullName)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Role Badge */}
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-medium shadow-lg mb-6">
                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1).toLowerCase()}
              </div>

              {/* Info Section */}
              <div className="text-center w-full">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 text-transparent bg-clip-text mb-6">
                  {user.fullName}
                </h1>

                <div className="space-y-3 max-w-md mx-auto">
                  {(user.institution || user.department) && (
                    <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl backdrop-blur-sm">
                      <FiUser className="w-5 h-5 text-blue-500" />
                      <span>{user.institution} {user.department && `• ${user.department}`}</span>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl backdrop-blur-sm">
                      <FiMapPin className="w-5 h-5 text-sky-500" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  {user.createdAt && (
                    <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl backdrop-blur-sm">
                      <FiClock className="w-5 h-5 text-blue-500" />
                      <span>Member since {new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Research Focus Card */}
          {user.role?.toLowerCase() === 'researcher' && user.fieldOfResearch && (
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500">
                  <FiTarget className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Research Focus</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {user.fieldOfResearch}
              </p>
            </div>
          )}

          {/* About Card */}
          {user.bio && (
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500">
                  <FiBookOpen className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">About</h2>
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            </div>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500">
                  <FiAward className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Research Projects</h2>
              </div>
              
              <div className="space-y-6">
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className="bg-white/50 rounded-2xl p-6 backdrop-blur-sm border border-white/20"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    {project.status && (
                      <span className={`inline-block px-4 py-1.5 rounded-full font-medium ${
                        project.status.toLowerCase() === 'completed' 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                          : project.status.toLowerCase() === 'in progress'
                          ? 'bg-gradient-to-r from-blue-400 to-sky-400 text-white'
                          : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                      }`}>
                        {project.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="md:hidden">
        <MobileBottomNav />
      </footer>
    </div>
  );
}