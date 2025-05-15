import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiVideo, FiPhone, FiSettings, FiUserPlus, FiMoreVertical, FiPaperclip, FiSmile, FiSend, FiArrowLeft } from 'react-icons/fi';

// Mock users data - replace with actual data from your backend
const mockUsers = {
  'user-1': {
    id: 'user-1',
    name: 'Dr. Sarah Connor',
    avatar: 'SC',
    role: 'Lead Researcher'
  },
  'user-2': {
    id: 'user-2',
    name: 'Prof. James Wilson',
    avatar: 'JW',
    role: 'Senior Reviewer'
  },
  'user-3': {
    id: 'user-3',
    name: 'Dr. Emily Chen',
    avatar: 'EC',
    role: 'Research Associate'
  },
  'current-user': {
    id: 'current-user',
    name: 'You',
    avatar: 'ME',
    role: 'Researcher'
  }
};

// Temporary mock data - replace with actual data from your backend
const mockChats = {
  'group-1': {
    id: 'group-1',
    name: 'Research Team Alpha',
    type: 'group',
    avatar: '🔬',
    status: null,
    members: ['user-1', 'user-2', 'user-3'],
    messages: [
      { id: 1, senderId: 'user-1', text: "Hi there! How's the research project coming along?", time: '10:24 AM' },
      { id: 2, senderId: 'user-2', text: "Going great! We've made significant progress on the analysis phase.", time: '10:30 AM' },
      { id: 3, senderId: 'user-1', text: "That's excellent! Would you like to schedule a review meeting this week?", time: '10:32 AM' },
      { id: 4, senderId: 'user-3', text: "I've completed the preliminary data analysis. Should we review it in the meeting?", time: '10:35 AM' },
      { id: 5, senderId: 'current-user', text: "Yes, that would be perfect. Let's schedule it for tomorrow at 2 PM?", time: '10:36 AM' },
    ]
  },
  'user-1': {
    id: 'user-1',
    name: 'Dr. Sarah Connor',
    type: 'direct',
    avatar: 'SC',
    status: 'Online',
    role: 'Lead Researcher',
    messages: [
      { id: 1, senderId: 'user-1', text: 'Can we review the latest findings?', time: '10:24 AM' },
      { id: 2, senderId: 'current-user', text: "Yes, I've just finished compiling them.", time: '10:30 AM' },
    ]
  }
};

export default function ChatView() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState('');
  const [chat, setChat] = useState(null);

  useEffect(() => {
    // In a real app, fetch chat data from your backend
    const chatData = mockChats[chatId];
    if (chatData) {
      setChat(chatData);
    }
  }, [chatId]);

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // In a real app, send message to your backend
    console.log('Sending message:', messageInput);
    setMessageInput('');
  };

  const getSenderInfo = (senderId) => {
    return mockUsers[senderId] || { name: 'Unknown User', avatar: '??' };
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
                      {chat.avatar}
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                        {chat.avatar}
                      </div>
                      {chat.status === 'Online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 truncate">{chat.name}</h2>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.type === 'group' ? `${chat.members.length} members` : chat.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <FiPhone className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <FiVideo className="h-5 w-5" />
              </button>
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
        <div className="flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full text-sm text-gray-500 shadow-sm">
            Today
          </div>
        </div>

        {chat.messages.map((message, index) => {
          const isCurrentUser = message.senderId === 'current-user';
          const sender = getSenderInfo(message.senderId);
          const showSender = chat.type === 'group' && (
            index === 0 || 
            chat.messages[index - 1]?.senderId !== message.senderId
          );

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-end space-x-2 max-w-[70%]">
                {!isCurrentUser && (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      {sender.avatar}
                    </div>
                  </div>
                )}
                <div className="flex flex-col">
                  {showSender && !isCurrentUser && (
                    <span className="text-sm text-gray-500 ml-1 mb-1">{sender.name}</span>
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
                      {message.time}
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
              disabled={!messageInput.trim()}
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