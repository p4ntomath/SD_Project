import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageSquare, FiArrowLeft, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import { ChatService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth, db } from '../backend/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function MessagesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [participantPhotos, setParticipantPhotos] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;

    const initializeChats = () => {
      try {
        unsubscribe = ChatRealTimeService.subscribeToUserChats(auth.currentUser.uid, (chatsData) => {
          setChats(chatsData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error initializing chats:', error);
        setLoading(false);
      }
    };

    initializeChats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Function to search for users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await ChatService.searchUsers(query, auth.currentUser.uid);
      setUserSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Function to start a chat with a user
  const startChat = async (userId) => {
    try {
      setError(null);
      setLoading(true);
      const chatId = await ChatService.createDirectChat(auth.currentUser.uid, userId);
      setShowNewChatModal(false);
      setSearchQuery('');
      setUserSearchResults([]);
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError(error.message || 'Failed to create chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a group chat
  const createGroupChat = async () => {
    if (selectedUsers.length < 2 || !groupName) return;
    try {
      setError(null);
      setLoading(true);
      const participantIds = selectedUsers.map(user => user.id);
      const chatId = await ChatService.createGroupChat(auth.currentUser.uid, participantIds, groupName);
      setShowNewChatModal(false);
      setShowGroupChatModal(false);
      setSearchQuery('');
      setSelectedUsers([]);
      setGroupName('');
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError(error.message || 'Failed to create group chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = () => {
    let filtered = [...chats];

    // Apply search filter to existing chats
    if (searchQuery && !showNewChatModal) {
      filtered = filtered.filter(chat => 
        chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (activeFilter) {
      case 'groups':
        filtered = filtered.filter(chat => chat.type === 'group');
        break;
      case 'direct':
        filtered = filtered.filter(chat => chat.type === 'direct');
        break;
      case 'unread':
        filtered = filtered.filter(chat => chat.unreadCount > 0);
        break;
      default:
        break;
    }

    return filtered;
  };

  // Get chat name for display
  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      // For group chats, return the group name
      return chat.groupName;
    }
    // For direct chats, get the other participant's name
    const otherUserId = chat.participants.find(id => id !== auth.currentUser.uid);
    const participantName = chat.participantNames?.[otherUserId];
    return participantName || 'Unknown User';
  };

  // Get avatar initials for a name
  const getAvatarInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'U';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle both client timestamp and server timestamp
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Add effect to fetch profile pictures for chat participants
  useEffect(() => {
    const fetchProfilePictures = async () => {
      const photos = {};
      const uniqueUserIds = new Set();

      // Collect all unique user IDs from chats
      chats.forEach(chat => {
        if (chat.type === 'direct') {
          // For direct chats, get the other participant
          const otherUserId = chat.participants.find(id => id !== auth.currentUser.uid);
          if (otherUserId) uniqueUserIds.add(otherUserId);
        }
      });

      // Fetch profile pictures for all unique users
      await Promise.all(
        Array.from(uniqueUserIds).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              photos[userId] = userDoc.data().profilePicture || null;
            }
          } catch (error) {
            console.error(`Error fetching profile picture for ${userId}:`, error);
          }
        })
      );

      setParticipantPhotos(photos);
    };

    if (chats.length > 0) {
      fetchProfilePictures();
    }
  }, [chats]);

  const getMessagePreview = (lastMessage) => {
    if (!lastMessage) return 'No messages yet';
    
    if (lastMessage.attachments?.length > 0) {
      const attachment = lastMessage.attachments[0];
      if (attachment.type.startsWith('image/')) {
        return '📷 Photo' + (lastMessage.attachments.length > 1 ? ` (+${lastMessage.attachments.length - 1})` : '');
      } else if (attachment.type.startsWith('video/')) {
        return '🎥 Video' + (lastMessage.attachments.length > 1 ? ` (+${lastMessage.attachments.length - 1})` : '');
      } else if (attachment.type.startsWith('audio/')) {
        return '🎵 Audio' + (lastMessage.attachments.length > 1 ? ` (+${lastMessage.attachments.length - 1})` : '');
      } else {
        return '📎 File' + (lastMessage.attachments.length > 1 ? ` (+${lastMessage.attachments.length - 1})` : '');
      }
    }
    
    return lastMessage.text || 'No messages yet';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button 
              onClick={() => navigate('/home')}
              className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
            >
              <FiArrowLeft className="h-5 w-5 mr-1" />
              Dashboard
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowNewChatModal(true);
                  setShowGroupChatModal(false);
                  setSearchQuery('');
                  setSelectedUsers([]);
                  setGroupName('');
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiUserPlus className="h-4 w-4 mr-1.5" />
                
              </button>
              <button
                onClick={() => {
                  setShowGroupChatModal(true);
                  setShowNewChatModal(true);
                  setSearchQuery('');
                  setSelectedUsers([]);
                  setGroupName('');
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiUsers className="h-4 w-4 mr-1.5" />
                
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg mt-4 overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            {showNewChatModal && showGroupChatModal ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Group name..."
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users to add..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <span
                        key={user.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {user.fullName}
                        <button
                          type="button"
                          onClick={() => setSelectedUsers(users => users.filter(u => u.id !== user.id))}
                          className="ml-1 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {selectedUsers.length >= 2 && groupName && (
                  <button
                    onClick={createGroupChat}
                    className="w-full py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Create Group Chat
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={showNewChatModal ? "Search users..." : "Search messages..."}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (showNewChatModal) {
                        searchUsers(e.target.value);
                      }
                    }}
                  />
                </div>

                {!showNewChatModal && (
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFilter('groups')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeFilter === 'groups'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Groups
                    </button>
                    <button
                      onClick={() => setActiveFilter('direct')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeFilter === 'direct'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Direct
                    </button>
                    <button
                      onClick={() => setActiveFilter('unread')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeFilter === 'unread'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat Lists or Search Results */}
          <div className="divide-y divide-gray-200 max-h-[calc(100vh-12rem)] overflow-y-auto"> {/* Added max height and scroll */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : showNewChatModal ? (
              searching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Searching users...</div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : userSearchResults.length > 0 ? (
                userSearchResults.map(user => (
                  <button 
                    key={user.id}
                    onClick={() => {
                      if (showGroupChatModal) {
                        // Add/remove user from selected users
                        if (selectedUsers.some(u => u.id === user.id)) {
                          setSelectedUsers(users => users.filter(u => u.id !== user.id));
                        } else {
                          setSelectedUsers(users => [...users, user]);
                        }
                      } else {
                        startChat(user.id);
                      }
                    }}
                    className="w-full text-left hover:bg-gray-50 p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                            {getAvatarInitials(user.fullName)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {showGroupChatModal && (
                        <div className="flex-shrink-0">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedUsers.some(u => u.id === user.id)
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300'
                          }`}>
                            {selectedUsers.some(u => u.id === user.id) && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-500">Start typing to search for users</p>
                </div>
              )
            ) : filteredChats().length > 0 ? (
              filteredChats().map(chat => (
                <button 
                  key={chat.id}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                  className={`w-full text-left hover:bg-gray-50 p-4 transition-colors`}
                >
                  <div className="flex items-center">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {chat.type === 'group' ? (
                          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-medium text-lg">
                            {chat.groupAvatar || '👥'}
                          </div>
                        ) : (
                          participantPhotos[chat.participants.find(id => id !== auth.currentUser.uid)] ? (
                            <img
                              src={participantPhotos[chat.participants.find(id => id !== auth.currentUser.uid)]}
                              alt={getChatDisplayName(chat)}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                              {getAvatarInitials(getChatDisplayName(chat))}
                            </div>
                          )
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className={`${
                          chat.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'
                        } truncate`}>
                          {getChatDisplayName(chat)}
                        </p>
                        <p className={`text-sm truncate ${
                          chat.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'
                        }`}>
                          {getMessagePreview(chat.lastMessage)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end justify-between flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${
                          chat.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'
                        }`}>
                          {chat.lastMessage ? formatRelativeTime(chat.lastMessage.clientTimestamp || chat.lastMessage.timestamp) : ''}
                        </span>
                        {chat.lastMessage?.senderId === auth.currentUser.uid && (
                          <span className="text-xs text-gray-400">
                            {chat.lastMessage.readBy?.length > 1 ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="mt-1 bg-blue-600 text-white text-xs font-medium rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-500">No chats found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}