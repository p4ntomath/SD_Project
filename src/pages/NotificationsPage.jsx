import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import { notify } from '../backend/firebase/notificationsUtil';
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FiBell } from 'react-icons/fi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', auth.currentUser.uid), // <-- updated field
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp)
      }));
      setNotifications(notificationItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      readStatus: true
    });
  };

  if (loading) {
    return (
      <section className="flex flex-col h-screen bg-gray-50">
        <MainNav />
        <section className="flex justify-center items-center flex-1">
          <p className="text-gray-500">Loading notifications...</p>
        </section>
      </section>
    );
  }

  return (
    <section  className="min-h-screen bg-gray-50 flex flex-col">
      <MainNav />

      <main className="flex-1 p-4 md:p-2 pb-16 md:pb-8">
        <section className="max-w-3xl mx-auto p-4 sm:p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-left">Your Notifications</h2>
        {notifications.length === 0 ? (
          <section className="bg-white rounded-xl p-8 shadow  text-center flex flex-col items-center justify-center">
            <FiBell className="text-5xl text-blue-400 mb-4" />
            <p className="text-lg text-gray-700 font-semibold mb-2">No notifications yet</p>
            <p className="text-gray-500">You're all caught up! We'll let you know when something needs your attention.</p>
          </section>
        ) : (
          <ul className="space-y-4">
            {notifications.map(notification => (
              <li key={notification.id}>
                <section
                  className={`p-4 rounded-xl shadow border transition-colors ${
                    !notification.readStatus
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-white border-gray-200'
                  } ${
                    notification.type === 'Collaboration Request Received' ||
                     notification.type === 'Funding Opportunity Added' ||
                       notification.type === 'Funding Opportunity Updated' || !notification.projectId
                      ? 'cursor-default'
                      : 'cursor-pointer'
                  }`}
                  onClick={() => {
                    // Block navigation for "Collaboration Request Received" notifications
                    if (
                      notification.type === 'Collaboration Request Received' ||
                       notification.type === 'Funding Opportunity Added' ||
                       notification.type === 'Funding Opportunity Updated' ||
                      !notification.projectId
                    ) {
                      return;
                    }
                    navigate(`/projects/${notification.projectId}`);
                  }}
                >
                  <section className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-blue-600">{notification.type}</h3>
                    <time className="text-xs text-gray-500">
                      {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </section>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  {!notification.readStatus && (
                    <button
                      className="mt-2 text-xs text-blue-600 underline hover:text-blue-800 cursor-pointer"
                      onClick={e => {
                        e.stopPropagation(); // Prevent navigation when clicking "Mark as read"
                        markAsRead(notification.id);
                      }}
                    >
                      Mark as read
                    </button>
                  )}
                </section>
              </li>
            ))}
          </ul>
        )}
        </section>
      </main>
<footer>
        <MobileBottomNav />
      </footer>

    </section>
    
  );
};

export default NotificationsPage;