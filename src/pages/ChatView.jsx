import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiVideo, FiPhone, FiSettings, FiUserPlus, FiMoreVertical, FiPaperclip, FiSmile, FiSend, FiArrowLeft, FiSearch, FiX } from 'react-icons/fi';
import { ChatService, MessageService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';
import EmojiPicker from 'emoji-picker-react';

export default function ChatView() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState('');
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [addingMembers, setAddingMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const chatViewRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Track if chat is visible and focused
  const [isVisible, setIsVisible] = useState(document.visibilityState === 'visible');
  const [isFocused, setIsFocused] = useState(true);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle window focus changes
  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Mark messages as read only when:
  // 1. Chat exists (chatId is valid)
  // 2. Browser tab is visible
  // 3. Window is focused
  // 4. Component is mounted
  // 5. There are messages to read
  useEffect(() => {
    if (chatId && isVisible && isFocused && messages.length > 0) {
      MessageService.markMessagesAsRead(chatId, auth.currentUser.uid);
    }
  }, [chatId, isVisible, isFocused, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let unsubscribeChat;
    let unsubscribeMessages;

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // First verify the chat exists and user has access
        const chatData = await ChatService.getUserChats(auth.currentUser.uid);
        const hasAccess = chatData.some(chat => chat.id === chatId);
        
        if (!hasAccess) {
          setError('Chat not found or access denied');
          navigate('/messages');
          return;
        }

        // Subscribe to chat updates
        unsubscribeChat = ChatRealTimeService.subscribeToChat(chatId, (chatData) => {
          if (!chatData) {
            setError('Chat not found');
            navigate('/messages');
            return;
          }

          // For direct chats, set the other participant's name as chat name
          if (chatData.type === 'direct') {
            const otherUserId = chatData.participants.find(id => id !== auth.currentUser.uid);
            chatData.name = chatData.participantNames?.[otherUserId] || 'Unknown User';
          }
          
          setChat(chatData);
        });

        // Subscribe to messages and mark as read
        unsubscribeMessages = ChatRealTimeService.subscribeToMessages(chatId, (messagesData) => {
          const messagesWithNames = messagesData.map(msg => ({
            ...msg,
            senderName: chat?.participantNames?.[msg.senderId] || 'Unknown User'
          }))
          // Messages are already sorted newest first from the subscription
          .reverse(); // Reverse to display oldest first in the chat view
          setMessages(messagesWithNames);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to load chat');
        setLoading(false);
      }
    };

    if (chatId) {
      initializeChat();
    }

    return () => {
      if (unsubscribeChat) unsubscribeChat();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [chatId, navigate]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      await MessageService.sendMessage(chatId, auth.currentUser.uid, {
        text: messageInput
      });
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Function to search for users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await ChatService.searchUsers(query, auth.currentUser.uid);
      // Filter out users that are already in the chat
      const filteredResults = results.filter(user => !chat.participants.includes(user.id));
      setUserSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Modify addUserToGroup to handle multiple users
  const addUsersToGroup = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      setAddingMembers(true);
      await Promise.all(
        Array.from(selectedUsers).map(userId =>
          ChatService.addUserToGroupChat(chatId, userId)
        )
      );
      setSearchQuery('');
      setUserSearchResults([]);
      setSelectedUsers(new Set());
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding users to group:', error);
    } finally {
      setAddingMembers(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Click handler for emoji picker
  const handleClickOutside = (event) => {
    if (
      emojiButtonRef.current?.contains(event.target) ||
      emojiPickerRef.current?.contains(event.target)
    ) {
      return;
    }
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const toggleEmojiPicker = (e) => {
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">{error}</div>
      </div>
    );
  }

  // Add check for chat existence
  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Chat not found</div>
      </div>
    );
  }

  // Format timestamp to readable time
  const formatMessageTime = (timestamp) => {
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
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    
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

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const messagesByDate = messages.reduce((groups, message) => {
    let date;
    const timestamp = message.timestamp || message.clientTimestamp;
    
    if (!timestamp) {
      date = new Date(); // fallback to current date if no timestamp
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate(); // Firebase Timestamp
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000); // Firebase Timestamp-like object
    } else {
      date = new Date(timestamp); // Try to parse as a date string/number
    }
    
    const dateStr = formatMessageDate(date);
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(message);
    return groups;
  }, {});

  // Get sender's avatar initials
  const getAvatarInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'U';
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  // Helper function to check if message is read by others (not the sender)
  const isMessageReadByOthers = (message) => {
    if (!message?.readBy || !chat?.participants) return false;
    
    // Get other participants (excluding sender)
    const otherParticipants = chat.participants.filter(id => id !== message.senderId);
    if (otherParticipants.length === 0) return false;

    // Check if any other participant has read the message
    return otherParticipants.some(participantId => {
      return message.readBy.includes(participantId);
    });
  };

  // Helper function to check if message is delivered
  const isMessageDelivered = (message) => {
    // Message is delivered if it has a timestamp and at least one recipient
    if (!message?.timestamp || !chat?.participants) return false;
    
    const recipients = chat.participants.filter(id => id !== message.senderId);
    if (recipients.length === 0) return false;

    // Message is considered delivered if it has successfully been saved with a timestamp
    return true;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <div className="flex-1 flex items-center min-w-0">
              <button 
                onClick={() => {
                  // First mark all messages as read before navigating back
                  MessageService.markMessagesAsRead(chatId, auth.currentUser.uid);
                  // Navigate without replace to ensure MessagesList remounts
                  navigate('/messages');
                }}
                className="md:hidden text-gray-600 hover:text-gray-800 font-medium flex items-center mr-4 flex-shrink-0"
              >
                <FiArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative flex-shrink-0">
                  {chat?.type === 'group' ? (
                    <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium text-lg">
                      {chat.groupAvatar || '👥'}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                      {getAvatarInitials(chat?.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 truncate">{chat?.groupName || chat?.name}</h2>
                  {chat?.type === 'group' && (
                    <p className="text-sm text-gray-500 truncate">
                      {chat.participantNames ?
                        Object.values(chat.participantNames)
                          .map(name => name.split(' ')[0]) // Get first names
                          .slice(0, 3) // Take first 3 names
                          .join(', ') + 
                        (chat.participants.length > 3 ? ` and ${chat.participants.length - 3} others` : '')
                        : `${chat.participants?.length || 0} members`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {chat?.type === 'group' && (
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <FiUserPlus className="h-5 w-5" />
                </button>
              )}
              <button className="hidden md:block p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <FiMoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Members</h3>
                <button 
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSearchQuery('');
                    setUserSearchResults([]);
                    setSelectedUsers(new Set());
                  }}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Searching users...</div>
                </div>
              ) : userSearchResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {userSearchResults.map(user => (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className="w-full text-left hover:bg-gray-50 p-4 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium">
                            {getAvatarInitials(user.fullName)}
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 border-2 rounded ${
                            selectedUsers.has(user.id)
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedUsers.has(user.id) && (
                              <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No users found</div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Type to search for users</div>
                </div>
              )}
            </div>
            {selectedUsers.size > 0 && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={addUsersToGroup}
                  disabled={addingMembers}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addingMembers ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding members...
                    </>
                  ) : (
                    `Add ${selectedUsers.size} member${selectedUsers.size > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatViewRef}>
        {Object.entries(messagesByDate).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-200 rounded-full px-3 py-1">
                <span className="text-xs font-medium text-gray-600">{date}</span>
              </div>
            </div>
            <div className="space-y-4">
              {dateMessages.map((message, index) => {
                const isCurrentUser = message.senderId === auth.currentUser.uid;
                const showSender = !isCurrentUser && chat.type === 'group' && (
                  index === 0 || 
                  dateMessages[index - 1]?.senderId !== message.senderId
                );
                const senderName = chat.participantNames?.[message.senderId] || 'Unknown User';

                return (
                  <div key={message.id}>
                    {showSender && (
                      <p className="text-sm text-gray-500 mb-1">
                        {senderName}
                      </p>
                    )}
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {showSender && (
                        <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-medium mr-2">
                          {getAvatarInitials(senderName)}
                        </div>
                      )}
                      <div className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
                        isCurrentUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200 relative">
        <div className="flex items-end space-x-2 max-w-7xl mx-auto">
          <div className="flex-1 bg-gray-100 rounded-lg">
            <textarea
              rows="1"
              placeholder="Type your message..."
              className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500 px-4 py-3 resize-none min-h-[44px] max-h-[120px]"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                e.target.style.height = '44px';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-3 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiPaperclip className="h-5 w-5" />
            </button>
            <button 
              ref={emojiButtonRef}
              onClick={toggleEmojiPicker}
              className="p-3 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <FiSmile className="h-5 w-5" />
            </button>
            <button 
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendingMessage}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className="absolute bottom-20 right-16 z-50"
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              const textarea = document.querySelector('textarea');
              const cursorPosition = textarea.selectionStart;
              setMessageInput(prev => prev.slice(0, cursorPosition) + emojiData.emoji + prev.slice(cursorPosition));
              textarea.focus();
            }}
            height={400}
            width={320}
            theme="light"
            emojiStyle="native"
            searchPlaceHolder="Search emoji..."
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
}