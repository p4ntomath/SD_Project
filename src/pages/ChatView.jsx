import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiVideo, FiPhone, FiSettings, FiUserPlus, FiPaperclip, FiSmile, FiSend, FiArrowLeft, FiSearch, FiX, FiCheck, FiEdit2 } from 'react-icons/fi';
import { ChatService, MessageService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth, db } from '../backend/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import EmojiPicker from 'emoji-picker-react';
import MediaPreview from '../components/MediaPreview';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import getCroppedImg from '../components/CropImage';

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
  const [participantPhotos, setParticipantPhotos] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroup, setRenamingGroup] = useState(false);
  const [removingMember, setRemovingMember] = useState('');
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const messagesEndRef = useRef(null);
  const chatViewRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Track if chat is visible and focused
  const [isVisible, setIsVisible] = useState(document.visibilityState === 'visible');
  const [isFocused, setIsFocused] = useState(true);

  // Skip smooth scrolling for bulk message loads
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  // Helper function for scrolling
  const scrollToBottom = (behavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Initial load: use instant scroll
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      scrollToBottom('auto');
      setIsInitialLoad(false);
    }
  }, [messages, isInitialLoad]);

  // New messages: use smooth scroll only if it's not the initial load
  useEffect(() => {
    if (messages.length > 0 && !isInitialLoad) {
      scrollToBottom('smooth');
    }
  }, [messages, isInitialLoad]);

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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
    // Initialize progress for each file
    const initialProgress = {};
    files.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && attachments.length === 0) || sendingMessage) return;

    try {
      setSendingMessage(true);
      setOverallProgress(0);

      // If there are attachments, we'll track their upload progress
      if (attachments.length > 0) {
        const totalFiles = attachments.length;
        let completed = 0;

        await MessageService.sendMessage(chatId, auth.currentUser.uid, {
          text: messageInput,
          attachments,
          onProgress: (fileName, progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileName]: progress
            }));
            if (progress === 100) {
              completed++;
              setOverallProgress((completed / totalFiles) * 100);
            }
          }
        });
      } else {
        // Just send the text message
        await MessageService.sendMessage(chatId, auth.currentUser.uid, {
          text: messageInput
        });
      }

      setMessageInput('');
      setAttachments([]);
      setUploadProgress({});
      setOverallProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  // Add this new effect to fetch participant profile pictures
  useEffect(() => {
    if (!chat?.participants) return;

    const fetchParticipantPhotos = async () => {
      const photos = {};
      await Promise.all(
        chat.participants.map(async (userId) => {
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

    fetchParticipantPhotos();
  }, [chat?.participants]);

  // Function to handle group rename
  const handleRenameGroup = async () => {
    if (!newGroupName.trim() || renamingGroup) return;
    
    try {
      setRenamingGroup(true);
      await ChatService.updateGroupChatDetails(chatId, { groupName: newGroupName.trim() });
      setIsEditingName(false);
      setNewGroupName('');
    } catch (error) {
      console.error('Error renaming group:', error);
    } finally {
      setRenamingGroup(false);
    }
  };

  // Function to remove member from group
  const handleRemoveMember = async (memberId) => {
    if (removingMember || memberId === auth.currentUser.uid) return;
    
    try {
      setRemovingMember(memberId);
      await ChatService.removeUserFromGroupChat(chatId, memberId);
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setRemovingMember('');
    }
  };

  // Add this function to handle avatar change
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      setIsChangingAvatar(true);
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      // Create a File object
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

      // Compress the image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      await ChatService.updateGroupAvatar(chatId, compressedFile);
      setShowCropModal(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error updating group avatar:', error);
    } finally {
      setIsChangingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center h-screen bg-gray-50">
        <section className="text-gray-500">Loading chat...</section>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex items-center justify-center h-screen bg-gray-50">
        <section className="text-gray-500">{error}</section>
      </section>
    );
  }

  // Add check for chat existence
  if (!chat) {
    return (
      <section className="flex items-center justify-center h-screen bg-gray-50">
        <section className="text-gray-500">Chat not found</section>
      </section>
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

  const renderMessage = (message, isCurrentUser, showSender, senderName) => {
    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
        {/* Add a fixed-width space for avatar to maintain alignment */}
        {!isCurrentUser && (
          <div className="w-8 mr-2 flex-shrink-0">
            {showSender && (
              <Link to={`/profile/${message.senderId}`}>
                {participantPhotos[message.senderId] ? (
                  <img
                    src={participantPhotos[message.senderId]}
                    alt={senderName}
                    className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-medium hover:bg-gray-600 transition-colors">
                    {getAvatarInitials(senderName)}
                  </div>
                )}
              </Link>
            )}
          </div>
        )}
        <div className={`rounded-lg px-4 py-2 max-w-[70%] space-y-2 ${
          isCurrentUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-300 text-black'
        }`}>
          {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
          {message.attachments?.map((attachment, index) => (
            <MediaPreview 
              key={index} 
              attachment={attachment}
              className={index > 0 ? 'mt-2' : ''}
            />
          ))}
          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
            {formatMessageTime(message.timestamp || message.clientTimestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col h-screen">
      {/* Chat Header - Fixed height */}
      <header className="flex-none bg-white border-b border-gray-200">
        <section className="max-w-7xl mx-auto px-4">
          <section className="flex items-center h-16">
            <section className="flex-1 flex items-center min-w-0">
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
                {/* Make avatar and name clickable for groups */}
                <div 
                  className={`relative flex-shrink-0 ${chat?.type === 'group' ? 'cursor-pointer' : ''}`}
                  onClick={() => chat?.type === 'group' && setShowGroupInfoModal(true)}
                >
                  {chat?.type === 'group' ? (
                    chat.groupAvatar ? (
                      <img 
                        src={chat.groupAvatar}
                        alt="Group Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium text-lg hover:bg-purple-200 transition-colors">
                        👥
                      </div>
                    )
                  ) : (
                    <Link to={`/profile/${chat?.participants?.find(id => id !== auth.currentUser.uid)}`}>
                      {participantPhotos[chat?.participants?.find(id => id !== auth.currentUser.uid)] ? (
                        <img
                          src={participantPhotos[chat?.participants?.find(id => id !== auth.currentUser.uid)]}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium hover:bg-gray-600 transition-colors">
                          {getAvatarInitials(chat?.name)}
                        </div>
                      )}
                    </Link>
                  )}
                </div>
                <div 
                  className={`min-w-0 flex-1 ${chat?.type === 'group' ? 'cursor-pointer' : ''}`}
                  onClick={() => chat?.type === 'group' && setShowGroupInfoModal(true)}
                >
                  <h2 className="font-semibold text-gray-900 truncate hover:text-gray-700 transition-colors">
                    {chat?.groupName || chat?.name}
                  </h2>
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
                </section>
              </section>
            </section>

            <section className="flex items-center space-x-2 flex-shrink-0">
              {chat?.type === 'group' && (
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Add members"
                >
                  <FiUserPlus className="h-5 w-5" />
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <section className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <section className="bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all">
            <section className="p-6 border-b border-gray-100">
              <section className="flex items-center justify-between">
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
              </section>
              <section className="mt-4">
                <section className="relative">
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
                </section>
              </section>
            </section>
            <section className="max-h-96 overflow-y-auto">
              {searching ? (
                <section className="flex items-center justify-center py-8">
                  <section className="text-gray-500">Searching users...</section>
                </section>
              ) : userSearchResults.length > 0 ? (
                <section className="sectionide-y sectionide-gray-100">
                  {userSearchResults.map(user => (
                    <section
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className="w-full text-left hover:bg-gray-50 p-4 transition-colors cursor-pointer"
                    >
                      <section className="flex items-center">
                        <section className="flex-shrink-0">
                          <section className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium">
                            {getAvatarInitials(user.fullName)}
                          </section>
                        </section>
                        <section className="ml-4 flex-1">
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </section>
                        <section className="flex-shrink-0">
                          <section className={`w-5 h-5 border-2 rounded ${
                            selectedUsers.has(user.id)
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedUsers.has(user.id) && (
                              <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </section>
                        </section>
                      </section>
                    </section>
                  ))}
                </section>
              ) : searchQuery ? (
                <section className="flex items-center justify-center py-8">
                  <section className="text-gray-500">No users found</section>
                </section>
              ) : (
                <section className="flex items-center justify-center py-8">
                  <section className="text-gray-500">Type to search for users</section>
                </section>
              )}
            </section>
            {selectedUsers.size > 0 && (
              <section className="p-4 border-t border-gray-100">
                <button
                  onClick={addUsersToGroup}
                  disabled={addingMembers}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addingMembers ? (
                    <>
                      <section className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></section>
                      Adding members...
                    </>
                  ) : (
                    `Add ${selectedUsers.size} member${selectedUsers.size > 1 ? 's' : ''}`
                  )}
                </button>
              </section>
            )}
          </section>
        </section>
      )}

      {/* Group Info Modal */}
      {showGroupInfoModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all my-4 flex flex-col min-h-0 max-h-[calc(100vh-2rem)]">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              {/* Header Content */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Group Information</h3>
                <button 
                  onClick={() => setShowGroupInfoModal(false)}
                  className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-all"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              {/* Group Avatar and Stats */}
              <div className="mt-4 flex items-end space-x-4">
                <div className="relative group">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div 
                    onClick={() => !isChangingAvatar && avatarInputRef.current?.click()}
                    className="w-20 h-20 bg-white/10 text-white rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm cursor-pointer group-hover:bg-white/20 transition-all relative overflow-hidden"
                  >
                    {isChangingAvatar ? (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {chat?.groupAvatar ? (
                          <img 
                            src={chat.groupAvatar}
                            alt="Group Avatar"
                            className="w-20 h-20 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 flex items-center justify-center">
                            👥
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <FiEdit2 className="h-6 w-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 mb-2">
                  <div className="flex items-center space-x-2">
                    {isEditingName ? (
                      <input
                        type="text"
                        placeholder="Enter new group name"
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm transition-all"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    ) : (
                      <h4 className="text-lg text-white font-medium truncate">{chat?.groupName || chat?.name}</h4>
                    )}
                    <button
                      onClick={() => {
                        if (isEditingName) {
                          handleRenameGroup();
                        } else {
                          setIsEditingName(true);
                          setNewGroupName(chat?.groupName || chat?.name);
                        }
                      }}
                      className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                      {isEditingName ? (
                        <FiCheck className="h-5 w-5" />
                      ) : (
                        <FiEdit2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-white/80 text-sm mt-1">
                    {chat?.participants?.length || 0} participants
                  </p>
                </div>
              </div>
            </div>
            
            {/* Scrollable content with sticky subheader */}
            <div className="flex flex-col min-h-0 flex-1">
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                  <h4 className="text-gray-900 font-medium">Participants</h4>
                  <button
                    onClick={() => {
                      setShowGroupInfoModal(false);
                      setShowAddMemberModal(true);
                    }}
                    className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <FiUserPlus className="h-4 w-4" />
                    <span>Add People</span>
                  </button>
                </div>
              </div>
              
              {/* Scrollable participants list */}
              <div className="overflow-y-auto flex-1">
                <div className="p-6 space-y-2 relative">
                  {chat?.participants?.map((userId) => {
                    const isCurrentUser = userId === auth.currentUser.uid;
                    const userName = chat.participantNames?.[userId] || 'Unknown User';
                    const userPhoto = participantPhotos[userId];

                    return (
                      <div 
                        key={userId} 
                        className="group flex items-center justify-between p-3 rounded-xl transition-all hover:bg-gray-50 bg-white border border-gray-100"
                      >
                        <Link to={`/profile/${userId}`} className="flex items-center space-x-3">
                          {userPhoto ? (
                            <img
                              src={userPhoto}
                              alt={userName}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center font-medium ring-2 ring-white shadow-md hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 transition-colors">
                              {getAvatarInitials(userName)}
                            </div>
                          )}
                          <div>
                            <p className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
                              {userName}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isCurrentUser ? 'Group Admin' : 'Member'}
                            </p>
                          </div>
                        </Link>
                        {!isCurrentUser && chat.type === 'group' && (
                          <button
                            onClick={() => handleRemoveMember(userId)}
                            disabled={removingMember === userId}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            {removingMember === userId ? (
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiX className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowGroupInfoModal(false)}
                className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Flexible height with scroll */}
      <section className="flex-1 overflow-y-auto" ref={chatViewRef}>
        <section className="p-4 space-y-4">
          {Object.entries(messagesByDate).map(([date, dateMessages]) => (
            <section key={date}>
              <section className="flex items-center justify-center mb-4">
                <section className="bg-gray-200 rounded-full px-3 py-1">
                  <span className="text-xs font-medium text-gray-600">{date}</span>
                </section>
              </section>
              <section className="space-y-4">
                {dateMessages.map((message, index) => {
                  const isCurrentUser = message.senderId === auth.currentUser.uid;
                  const showSender = !isCurrentUser && chat.type === 'group' && (
                    index === 0 || 
                    dateMessages[index - 1]?.senderId !== message.senderId
                  );
                  const senderName = chat.participantNames?.[message.senderId] || 'Unknown User';

                  return (
                    <section key={message.id}>
                      {showSender && (
                        <p className="text-sm text-gray-500 mb-1">
                          {senderName}
                        </p>
                      )}

                      {renderMessage(message, isCurrentUser, showSender, senderName)}
                    </div>
                  );
                })}
              </section>
            </section>
          ))}
          <section ref={messagesEndRef} />
        </section>
      </section>

      {/* Message Input - Fixed height at bottom */}
      <section className="flex-none bg-white border-t border-gray-200">
        <section className="p-4">
          <section className="flex items-end space-x-2">
            <section className="flex-1 bg-gray-100 rounded-lg">
              <textarea
                rows="1"
                placeholder="Type your message..."
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500 px-4 py-3 resize-none min-h-[44px] max-h-[120px] overflow-y-auto"
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
              {attachments.length > 0 && (
                <div className="px-4 pb-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiPaperclip className="h-4 w-4" />
                      <span className="truncate flex-1">{file.name}</span>
                      {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
                        <span className="text-xs text-blue-600">{Math.round(uploadProgress[file.name])}%</span>
                      )}
                      {uploadProgress[file.name] === 100 && (
                        <FiCheck className="h-4 w-4 text-green-500" />
                      )}
                      {!sendingMessage && (
                        <button
                          onClick={() => {
                            setAttachments(files => files.filter((_, i) => i !== index));
                            setUploadProgress(prev => {
                              const newProgress = { ...prev };
                              delete newProgress[file.name];
                              return newProgress;
                            });
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {sendingMessage && attachments.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploading {attachments.length} file{attachments.length > 1 ? 's' : ''}...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                disabled={sendingMessage}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={sendingMessage}
                className="p-3 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPaperclip className="h-5 w-5" />
              </button>
              <button 
                ref={emojiButtonRef}
                onClick={toggleEmojiPicker}
                disabled={sendingMessage}
                className="p-3 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSmile className="h-5 w-5" />
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={(!messageInput.trim() && attachments.length === 0) || sendingMessage}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sendingMessage ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend className="h-5 w-5" />
                )}
              </button>
            </section>
          </section>
        </section>
      </section>

      {/* Emoji Picker - Absolute positioned */}
      {showEmojiPicker && (
        <section 
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
        </section>
      )}

      {/* Image Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Crop Group Avatar</h3>
            </div>
            <div className="relative h-[400px] bg-gray-900">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedImage(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={isChangingAvatar}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isChangingAvatar ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add the custom scrollbar styles */}
      <style jsx>{`
        /* Existing scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }

        /* Prevent content shift and gaps during scroll */
        .modal-content {
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000;
          -webkit-perspective: 1000;
        }
      `}</style>
    </div>
  );
}