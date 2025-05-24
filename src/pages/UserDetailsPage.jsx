import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../backend/firebase/firebaseConfig';
import { FaArrowLeft } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import MainNav from '../components/AdminComponents/Navigation/AdminMainNav';
import MobileBottomNav from '../components/AdminComponents/Navigation/AdminMobileBottomNav';

export default function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get avatar initials for users without profile picture
  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
        } else {
          console.error('User not found');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ClipLoader color="#3B82F6" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">User not found</h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="h-5 w-5 mr-2" />
              Back to Users List
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center mb-8">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.fullName}'s profile`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-semibold text-white bg-blue-600 border-4 border-gray-200">
                  {getAvatarInitials(user.fullName)}
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900 mt-4">{user.fullName}</h1>
              <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                'active'?.toLowerCase() === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : user.status?.toLowerCase() === 'inactive'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.status || 'Active'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <section>
                  <h2 className="text-lg font-semibold text-gray-700">Basic Information</h2>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Email:</span>{' '}
                      <span className="text-gray-600">{user.email}</span>
                    </p>
                    <p>
                      <span className="font-medium">Role:</span>{' '}
                      <span className="text-gray-600 capitalize">{user.role}</span>
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-gray-700">Institution Details</h2>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Institution:</span>{' '}
                      <span className="text-gray-600">{user.institution || 'Not specified'}</span>
                    </p>
                    <p>
                      <span className="font-medium">Department:</span>{' '}
                      <span className="text-gray-600">{user.department || 'Not specified'}</span>
                    </p>
                  </div>
                </section>

                {user.role === 'researcher' && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-700">Research Information</h2>
                    <div className="mt-2 space-y-2">
                      <p>
                        <span className="font-medium">Field of Research:</span>{' '}
                        <span className="text-gray-600">{user.fieldOfResearch || 'Not specified'}</span>
                      </p>
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-4">
                <section>
                  <h2 className="text-lg font-semibold text-gray-700">Biography</h2>
                  <p className="mt-2 text-gray-600">
                    {user.bio || 'No biography provided'}
                  </p>
                </section>

                {user.createdAt && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-700">Account Information</h2>
                    <div className="mt-2">
                      <p>
                        <span className="font-medium">Joined:</span>{' '}
                        <span className="text-gray-600">
                          {new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </div>
  );
}