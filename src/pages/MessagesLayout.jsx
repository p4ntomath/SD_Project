import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MessagesList from './MessagesList';

export default function MessagesLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && location.pathname === '/messages') {
        navigate('/messages/group-1');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, navigate]);

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
          <Outlet />
        </div>
      </div>
    </div>
  );
}