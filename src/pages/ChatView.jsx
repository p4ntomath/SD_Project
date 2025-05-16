import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiVideo, FiPhone, FiSettings, FiUserPlus, FiMoreVertical, FiPaperclip, FiSmile, FiSend, FiArrowLeft } from 'react-icons/fi';
import { ChatService, MessageService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';

export default function ChatView() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState('');
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setChat(chatData);
        });

        // Subscribe to messages
        unsubscribeMessages = ChatRealTimeService.subscribeToMessages(chatId, (messagesData) => {
          setMessages(messagesData.sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds));
        });

        // Mark messages as read
        await MessageService.markMessagesAsRead(chatId, auth.currentUser.uid);
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

  // Format timestamp to readable time
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get sender's avatar initials
  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <div className="flex-1 flex items-center min-w-0">
              <button 
                onClick={() => navigate('/messages')}
                className="md:hidden text-gray-600 hover:text-gray-800 font-medium flex items-center mr-4 flex-shrink-0"
              >
                <FiArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative flex-shrink-0">
                  {chat.type === 'group' ? (
                    <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium text-lg">
                      {chat.groupAvatar || '👥'}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                      {getAvatarInitials(chat.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 truncate">{chat.groupName || chat.name}</h2>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.type === 'group' ? `${chat.participants?.length || 0} members` : 'Direct Message'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {chat.type === 'group' && (
                <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === auth.currentUser.uid;
          const showSender = chat.type === 'group' && (
            index === 0 || 
            messages[index - 1]?.senderId !== message.senderId
          );

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end space-x-2 max-w-[70%]">
                {!isCurrentUser && showSender && (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      {getAvatarInitials(message.senderName || 'User')}
                    </div>
                  </div>
                )}
                <div className="flex flex-col">
                  {showSender && !isCurrentUser && (
                    <span className="text-sm text-gray-500 ml-1 mb-1">{message.senderName}</span>
                  )}
                  <div 
                    className={`rounded-2xl px-4 py-2 shadow-sm ${
                      isCurrentUser
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p>{message.text}</p>
                    <span 
                      className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
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
            <button className="p-3 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiSmile className="h-5 w-5" />
            </button>
            <button 
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendingMessage}
              className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}