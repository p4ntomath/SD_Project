import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChatService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';
import MessagesList from './MessagesList';
import { FiMessageSquare } from 'react-icons/fi';

export default function MessagesLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const loadInitialChat = async () => {
      try {
        // Only attempt to load chats and navigate if we're at /messages
        if (location.pathname === '/messages') {
          const userChats = await ChatService.getUserChats(auth.currentUser.uid);
          if (userChats.length > 0) {
            // Navigate to the most recently updated chat
            navigate(`/messages/${userChats[0].id}`);
          }
        }
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error loading initial chat:', error);
        setInitialLoadComplete(true);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768 && location.pathname === '/messages' && initialLoadComplete) {
        loadInitialChat();
      }
    };

    loadInitialChat();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, navigate, initialLoadComplete]);

  const WelcomeView = () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <FiMessageSquare className="mx-auto h-12 w-12 text-purple-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Welcome to Messages</h3>
        <p className="mt-2 text-sm text-gray-500">
          Select a chat from the sidebar to start messaging, or create a new chat to get started.
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-full md:grid md:grid-cols-[320px_1fr]">
        {/* Messages list - always visible on desktop */}
        <div className={`${location.pathname === '/messages' ? 'block' : 'hidden md:block'} h-full bg-white border-r border-gray-200 overflow-hidden`}>
          <div className="h-full flex flex-col">
            <MessagesList />
          </div>
        </div>

        {/* Chat view - visible when a chat is selected */}
        <div className={`${location.pathname === '/messages' ? 'hidden md:block' : 'block'} h-full`}>
          {location.pathname === '/messages' ? <WelcomeView /> : <Outlet />}
        </div>
      </div>
    </div>
  );
}