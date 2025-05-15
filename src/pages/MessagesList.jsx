import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';

const groups = [
  {
    id: 'group-1',
    name: 'Research Team Alpha',
    lastMessage: 'Great progress on the findings!',
    time: '2m ago',
    unread: 3,
    avatar: '🔬'
  },
  {
    id: 'group-2',
    name: 'Project Review Board',
    lastMessage: 'Next meeting scheduled for...',
    time: '1h ago',
    unread: 0,
    avatar: '📊'
  }
];

const people = [
  {
    id: 'user-1',
    name: 'Dr. Sarah Connor',
    role: 'Lead Researcher',
    status: 'Online',
    lastSeen: 'Active now',
    avatar: 'SC',
    lastMessage: 'Can we review the latest findings?',
    time: '5m ago'
  },
  {
    id: 'user-2',
    name: 'Prof. James Wilson',
    role: 'Senior Reviewer',
    status: 'Offline',
    lastSeen: '12m ago',
    avatar: 'JW',
    lastMessage: 'The methodology looks sound.',
    time: '2h ago'
  }
];

export default function MessagesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  const filteredChats = () => {
    const unreadGroups = groups.filter(group => group.unread > 0);
    const unreadPeople = people.filter(person => person.unread > 0);

    switch (activeFilter) {
      case 'groups':
        return { showGroups: true, showPeople: false, groups, people: [] };
      case 'direct':
        return { showGroups: false, showPeople: true, groups: [], people };
      case 'unread':
        return { 
          showGroups: true, 
          showPeople: true, 
          groups: unreadGroups,
          people: unreadPeople
        };
      default:
        return { showGroups: true, showPeople: true, groups, people };
    }
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
            {filteredChats().showGroups && filteredChats().groups.map(group => (
              <button 
                key={group.id}
                onClick={() => navigate(`/messages/${group.id}`)}
                className="w-full text-left hover:bg-gray-50 p-4 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-medium text-lg flex-shrink-0">
                      {group.avatar}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{group.name}</p>
                      <p className="text-sm text-gray-500 truncate">{group.lastMessage}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end justify-between flex-shrink-0">
                    <span className="text-xs text-gray-400 mb-2">{group.time}</span>
                    {group.unread > 0 && (
                      <div className="bg-purple-600 text-white text-xs font-medium rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                        {group.unread}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {filteredChats().showPeople && filteredChats().people.map(person => (
              <button 
                key={person.id}
                onClick={() => navigate(`/messages/${person.id}`)}
                className="w-full text-left hover:bg-gray-50 p-4 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center font-medium">
                        {person.avatar}
                      </div>
                      {person.status === 'Online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{person.name}</p>
                      <p className="text-sm text-gray-500 truncate">{person.lastMessage}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end justify-between flex-shrink-0">
                    <span className="text-xs text-gray-400 mb-2">{person.time}</span>
                    {person.unread > 0 && (
                      <div className="bg-purple-600 text-white text-xs font-medium rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                        {person.unread}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {filteredChats().groups.length === 0 && filteredChats().people.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <FiMessageSquare className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No messages found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}