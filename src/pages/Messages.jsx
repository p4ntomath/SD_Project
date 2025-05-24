import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MessagesList from './MessagesList';

export default function Messages() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && location.pathname === '/messages') {
        // On larger screens, redirect to the first chat if no chat is selected
        // This will be handled by the MessagesList component once chats are loaded
        navigate('/messages');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, navigate]);

  return (
    <section className="h-screen bg-gray-50">
      <section className="h-full md:grid md:grid-cols-[380px_1fr]">
        <section className={`${
          location.pathname === '/messages' ? 'block' : 'hidden md:block'
        } h-full bg-white border-r border-gray-200`}>
          <MessagesList />
        </section>
        <section className={`${
          location.pathname === '/messages' ? 'hidden md:block' : 'block'
        } h-full bg-white`}>
          <Outlet />
        </section>
      </section>
    </section>
  );
}