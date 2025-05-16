import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import { ChatService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';

export default function MessagesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const filteredChats = () => {
    let filtered = [...chats];

    // Apply search filter
    if (searchQuery) {
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

  // Get avatar initials for a name
  const getAvatarInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <button 
              onClick={() => navigate('/home')}
              className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
            >
              <FiArrowLeft className="h-5 w-5 mr-1" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg mt-4">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('groups')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'groups'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => setActiveFilter('direct')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'direct'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Direct
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFilter === 'unread'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Chat Lists */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading chats...</div>
              </div>
            ) : filteredChats().length > 0 ? (
              filteredChats().map(chat => (
                <button 
                  key={chat.id}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                  className="w-full text-left hover:bg-gray-50 p-4 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {chat.type === 'group' ? (
                          <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium text-lg">
                            {chat.groupAvatar || '👥'}
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                            {getAvatarInitials(chat.name)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {chat.type === 'group' ? chat.groupName : chat.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end justify-between flex-shrink-0">
                      <span className="text-xs text-gray-400 mb-2">
                        {chat.lastMessage ? formatRelativeTime(chat.lastMessage.timestamp) : ''}
                      </span>
                      {chat.unreadCount > 0 && (
                        <div className="bg-purple-600 text-white text-xs font-medium rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
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