import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { searchUsers } from '../backend/firebase/viewprofile';
import { useAuth } from '../context/AuthContext';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { ChatService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';

export default function UserSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      performSearch(queryParam);
    }
  }, [searchParams]);

  const performSearch = async (query, isLoadingMore = false) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    if (!isLoadingMore) {
      setLoading(true);
    }
    setError(null);

    try {
      const results = await searchUsers(query.trim(), isLoadingMore ? page + 1 : 1, 10);
      if (isLoadingMore) {
        setUsers(prev => [...prev, ...results]);
        setPage(p => p + 1);
      } else {
        setUsers(results);
        setPage(1);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const loadMoreUsers = () => {
    if (loading || !searchQuery.trim()) return;
    performSearch(searchQuery, true);
  };

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header>
        <MainNav 
          setMobileMenuOpen={setMobileMenuOpen} 
          mobileMenuOpen={mobileMenuOpen}
        />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-16 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInput}
                placeholder="Search researchers and reviewers..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm text-base placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {loading && users.length === 0 ? (
            <div className="flex justify-center py-12">
              <ClipLoader color="#0a66c2" />
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="space-y-2">
                {users.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="bg-white rounded-lg p-4 border border-gray-300 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullName}
                            className="h-14 w-14 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-[#dce6f1] flex items-center justify-center text-[#0a66c2] text-xl font-medium border border-gray-200">
                            {getAvatarInitials(user.fullName)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-[#0a66c2]">
                              {user.fullName}
                            </h3>
                            <p className="text-[14px] font-medium text-[#0a66c2] mt-0.5">
                              {(user.role || 'Researcher').charAt(0).toUpperCase() + (user.role || 'Researcher').slice(1).toLowerCase()}
                            </p>
                            {(user.institution || user.department || user.fieldOfResearch) && (
                              <div className="mt-1 space-y-0.5">
                                {user.institution && (
                                  <p className="text-[13px] text-gray-600">
                                    {user.institution}
                                    {user.department && ` • ${user.department}`}
                                  </p>
                                )}
                                {user.fieldOfResearch && (
                                  <p className="text-[13px] text-gray-600">
                                    {user.fieldOfResearch}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const chatId = await ChatService.createDirectChat(auth.currentUser.uid, user.id);
                                navigate(`/messages/${chatId}`);
                              } catch (error) {
                                console.error('Error creating chat:', error);
                                // You might want to show an error notification here
                              }
                            }}
                            className="ml-4 px-4 py-1 text-[#0a66c2] text-sm font-medium border border-[#0a66c2] rounded-full hover:bg-[#0073b1]/10 transition-colors"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <ClipLoader color="#0a66c2" size={24} />
                </div>
              ) : users.length >= 10 && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={loadMoreUsers}
                    className="px-4 py-2 text-[#0a66c2] text-sm font-medium hover:bg-[#0073b1]/10 rounded-md transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          ) : searchQuery ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-300">
              <p className="text-gray-500">No results found</p>
            </div>
          ) : null}
        </div>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </div>
  );
}