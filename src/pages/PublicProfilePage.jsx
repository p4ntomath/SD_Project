import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../backend/firebase/firebaseConfig';
import { ClipLoader } from 'react-spinners';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FiUser, FiBookOpen, FiAward, FiTarget, FiClock, FiMapPin } from 'react-icons/fi';


export default function PublicProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [collaboratedProjects, setCollaboratedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (userId) {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ id: userSnap.id, ...userSnap.data() });
            
            const projectsRef = collection(db, 'projects');
            
            // Query for owned projects
            const ownedProjectsQuery = query(
              projectsRef,
              where('userId', '==', userId)
            );
            
            // Query to get all projects and filter for collaborations
            const projectsSnapshot = await getDocs(projectsRef);
            const collaboratedProjects = projectsSnapshot.docs
              .filter(doc => {
                const data = doc.data();
                return data.collaborators?.some(collab => collab.id === userId);
              })
              .map(doc => ({
                id: doc.id,
                ...doc.data(),
                relationship: 'collaborator'
              }))
              .filter(project => !project.visibility || project.visibility !== 'private');

            // Get owned projects
            const ownedProjectsSnap = await getDocs(ownedProjectsQuery);
            const owned = ownedProjectsSnap.docs
              .map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                relationship: 'owner' 
              }))
              .filter(project => !project.visibility || project.visibility !== 'private');
            
            setOwnedProjects(owned);
            setCollaboratedProjects(collaboratedProjects);
          } else {
            console.log('User not found:', userId);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 text-transparent bg-clip-text mb-4">
                  {user.fullName}
                </h1>

                {user.bio && (
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {user.bio}
                  </p>
                )}

                <div className="space-y-3 max-w-md mx-auto">
                  {user.institution && (
                    <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl backdrop-blur-sm">
                      <FiUser className="w-5 h-5 text-blue-500" />
                      <span>{user.institution}</span>
                    </div>
                  )}

                  {user.department && (
                    <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl backdrop-blur-sm">
                      <FiBookOpen className="w-5 h-5 text-sky-500" />
                      <span>{user.department}</span>
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

          {/* Projects Section */}
          {(ownedProjects.length > 0 || collaboratedProjects.length > 0) && (
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500">
                  <FiAward className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Research Projects</h2>
              </div>

              {/* Owned Projects */}
              {ownedProjects.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Projects Owned</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ownedProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="bg-white/80 rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-all"
                      >
                        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                          Owner
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            Status: {project.status || 'In Progress'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            Field: {project.researchField || 'Not specified'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            Deadline: {project.deadline ? new Date(project.deadline.seconds * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'Not set'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collaborated Projects */}
              {collaboratedProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Projects Collaborated On</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collaboratedProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="bg-white/80 rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition-all"
                      >
                        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-3">
                          Collaborator
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            Status: {project.status || 'In Progress'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            Field: {project.researchField || 'Not specified'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            Deadline: {project.deadline ? new Date(project.deadline.seconds * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'Not set'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Projects Message */}
              {ownedProjects.length === 0 && collaboratedProjects.length === 0 && (
                <p className="text-center text-gray-500">No public projects to display.</p>
              )}
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