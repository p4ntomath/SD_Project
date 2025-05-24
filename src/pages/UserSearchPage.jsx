import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { searchUsers } from '../backend/firebase/viewprofile';
import { useAuth } from '../context/AuthContext';

export default function UserSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      handleSearch(null, queryParam);
    }
  }, [searchParams]);

  const handleSearch = async (e, directQuery = null) => {
    if (e) e.preventDefault();
    const query = directQuery || searchQuery;
    if (!query.trim()) return;

    setLoading(true);
    try {
      const results = await searchUsers(query);
      setUsers(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f3f2ef] px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Search Header */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm text-base placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <ClipLoader color="#0a66c2" />
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-2">
            {users.map(user => (
              <div 
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className="bg-white rounded-lg p-4 border border-gray-300 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar/Profile Picture */}
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

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-[#0a66c2]">
                          {user.fullName}
                        </h3>
                        <p className="text-[14px] font-medium text-[#0a66c2] mt-0.5">
                          {(user.role || 'Researcher').charAt(0).toUpperCase() + (user.role || 'Researcher').slice(1).toLowerCase()}
                        </p>
                        <p className="text-[13px] text-gray-600 mt-0.5">
                          {user.institution}
                          {user.department && ` • ${user.department}`}
                        </p>
                        {user.fieldOfResearch && (
                          <p className="text-[13px] text-gray-600 mt-0.5">
                            {user.fieldOfResearch}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when clicking message button
                          navigate(`/messages/${user.id}`);
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
        ) : searchQuery ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-300">
            <p className="text-gray-500">No results found</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}