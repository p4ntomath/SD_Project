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
         
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <ClipLoader color="#3B82F6" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <article className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">User not found</h1>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Users List
          </button>
        </article>
      </main>
    );
  }

  return (
    <article className="min-h-screen bg-gray-50">
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-7xl mx-auto">
          <nav className="mb-6">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="h-5 w-5 mr-2" />
              Back to Users List
            </button>
          </nav>

          <section className="bg-white rounded-lg shadow p-6">
            <header className="flex flex-col items-center mb-8">
              {user.profilePicture ? (
                <figure>
                  <img
                    src={user.profilePicture}
                    alt={`${user.fullName}'s profile`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                </figure>
              ) : (
                <figure className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-semibold text-white bg-blue-600 border-4 border-gray-200">
                  {getAvatarInitials(user.fullName)}
                </figure>
              )}
              <h1 className="text-2xl font-bold text-gray-900 mt-4">{user.fullName}</h1>
              <aside className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                'active'?.toLowerCase() === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : user.status?.toLowerCase() === 'inactive'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.status || 'Active'}
              </aside>
            </header>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-4">
                <article>
                  <h2 className="text-lg font-semibold text-gray-700">Basic Information</h2>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="font-medium inline">Email: </dt>
                      <dd className="text-gray-600 inline">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="font-medium inline">Role: </dt>
                      <dd className="text-gray-600 capitalize inline">{user.role}</dd>
                    </div>
                  </dl>
                </article>

                <article>
                  <h2 className="text-lg font-semibold text-gray-700">Institution Details</h2>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="font-medium inline">Institution: </dt>
                      <dd className="text-gray-600 inline">{user.institution || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium inline">Department: </dt>
                      <dd className="text-gray-600 inline">{user.department || 'Not specified'}</dd>
                    </div>
                  </dl>
                </article>

                {user.role === 'researcher' && (
                  <article>
                    <h2 className="text-lg font-semibold text-gray-700">Research Information</h2>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="font-medium inline">Field of Research: </dt>
                        <dd className="text-gray-600 inline">{user.fieldOfResearch || 'Not specified'}</dd>
                      </div>
                    </dl>
                  </article>
                )}
              </section>

              <section className="space-y-4">
                <article>
                  <h2 className="text-lg font-semibold text-gray-700">Biography</h2>
                  <p className="mt-2 text-gray-600">
                    {user.bio || 'No biography provided'}
                  </p>
                </article>

                {user.createdAt && (
                  <article>
                    <h2 className="text-lg font-semibold text-gray-700">Account Information</h2>
                    <dl className="mt-2">
                      <div>
                        <dt className="font-medium inline">Joined: </dt>
                        <dd className="text-gray-600 inline">
                          <time dateTime={new Date(user.createdAt.seconds * 1000).toISOString()}>
                            {new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        </dd>
                      </div>
                    </dl>
                  </article>
                )}
              </section>
            </section>
          </section>
        </section>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </article>
  );
}