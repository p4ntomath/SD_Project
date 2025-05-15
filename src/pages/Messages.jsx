import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiVideo, 
  FiPhone, 
  FiSettings, 
  FiSearch, 
  FiMessageSquare, 
  FiUserPlus, 
  FiMoreVertical,
  FiPaperclip,
  FiSmile,
  FiSend
} from 'react-icons/fi';

const groups = [
  {
    id: 1,
    name: 'Research Team Alpha',
    lastMessage: 'Great progress on the findings!',
    time: '2m ago',
    unread: 3,
    avatar: '🔬'
  },
  {
    id: 2,
    name: 'Project Review Board',
    lastMessage: 'Next meeting scheduled for...',
    time: '1h ago',
    unread: 0,
    avatar: '📊'
  },
  {
    id: 3,
    name: 'Department Chat',
    lastMessage: 'Thanks for sharing the updates',
    time: '2h ago',
    unread: 0,
    avatar: '🏢'
  }
];

const people = [
  {
    id: 1,
    name: 'Dr. Sarah Connor',
    role: 'Lead Researcher',
    status: 'Online',
    lastSeen: 'Active now',
    avatar: 'SC'
  },
  {
    id: 2,
    name: 'Prof. James Wilson',
    role: 'Senior Reviewer',
    status: 'Offline',
    lastSeen: '12m ago',
    avatar: 'JW'
  },
  {
    id: 3,
    name: 'Dr. Emily Chen',
    role: 'Research Associate',
    status: 'Online',
    lastSeen: 'Active now',
    avatar: 'EC'
  }
];

const MessageLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(people[0]);
  const [messageInput, setMessageInput] = useState('');

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-[320px] bg-white border-r border-gray-200 flex flex-col">
        {/* User Profile Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/home')}
              className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
            >
              ← Back to Dashboard
            </button>
          </div>
          {/* Search Box */}
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
        </div>

        {/* Chat Lists */}
        <div className="flex-1 overflow-y-auto">
          {/* Groups Section */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Groups</h2>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                + New
              </button>
            </div>
            <div className="space-y-2">
              {groups.map(group => (
                <button 
                  key={group.id} 
                  className="w-full text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium text-lg">
                        {group.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500 truncate">{group.lastMessage}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-xs text-gray-400 min-w-[45px] text-right">
                        {group.time}
                      </span>
                      {group.unread > 0 && (
                        <div className="bg-purple-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                          {group.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* People Section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h2>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                + New
              </button>
            </div>
            <div className="space-y-2">
              {people.map(person => (
                <button 
                  key={person.id} 
                  onClick={() => setSelectedChat(person)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedChat.id === person.id ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        selectedChat.id === person.id ? 'bg-purple-600' : 'bg-gray-700'
                      }`}>
                        {person.avatar}
                      </div>
                      {person.status === 'Online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{person.name}</p>
                      <p className="text-sm text-gray-500">{person.role}</p>
                    </div>
                    <div className="ml-auto">
                      <p className="text-xs text-gray-500">{person.lastSeen}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-medium">
                {selectedChat.avatar}
              </div>
              {selectedChat.status === 'Online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
              <p className="text-sm text-gray-500">{selectedChat.status === 'Online' ? 'Active now' : selectedChat.lastSeen}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <FiPhone className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <FiVideo className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <FiUserPlus className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <FiMoreVertical className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          <div className="flex justify-center">
            <div className="bg-white px-4 py-2 rounded-full text-sm text-gray-500 shadow-sm">
              Today
            </div>
          </div>
          
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                {selectedChat.avatar}
              </div>
              <div className="max-w-[60%] bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                <p className="text-gray-900">Hi there! How's the research project coming along?</p>
                <span className="text-xs text-gray-500 mt-1">10:24 AM</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[60%] bg-purple-600 text-white rounded-2xl rounded-br-none px-4 py-2 shadow-sm">
              <p>Going great! We've made significant progress on the analysis phase.</p>
              <span className="text-xs text-purple-200 mt-1">10:30 AM</span>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                {selectedChat.avatar}
              </div>
              <div className="max-w-[60%] bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                <p className="text-gray-900">That's excellent! Would you like to schedule a review meeting this week?</p>
                <span className="text-xs text-gray-500 mt-1">10:32 AM</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[60%] bg-purple-600 text-white rounded-2xl rounded-br-none px-4 py-2 shadow-sm">
              <p>Yes, that would be great! How about Wednesday at 2 PM?</p>
              <span className="text-xs text-purple-200 mt-1">10:35 AM</span>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1 bg-gray-100 rounded-lg p-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500 resize-none px-2 py-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-500 hover:text-gray-600 rounded">
                    <FiPaperclip className="h-5 w-5" />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-600 rounded">
                    <FiSmile className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            <button 
              className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={!messageInput.trim()}
            >
              <FiSend className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessageLayout;