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
      where('userId', '==', auth.currentUser.uid),
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
        <section className="bg-white rounded-xl p-8 shadow border text-left">
        <p className="text-gray-500">No notifications to display</p>
        </section>
    ) : (
        <ul className="space-y-4">
         {notifications.map(notification => (
        <li key={notification.id}>
          <section
            className={`p-4 rounded-xl shadow border transition-colors cursor-pointer ${
              !notification.readStatus
                ? 'bg-blue-50 border-blue-400'
                : 'bg-white border-gray-200'
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <section className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-blue-600">{notification.type}</h3>
              <time className="text-xs text-gray-500">
                {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </section>
            <p className="text-gray-700 mb-2">{notification.message}</p>
            {notification.projectId && (
              <section className="mt-2">
                <span className="text-xs font-mono text-gray-400">Project ID: {notification.projectId}</span>
              </section>
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