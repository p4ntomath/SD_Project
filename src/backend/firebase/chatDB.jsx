import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  arrayUnion, 
  arrayRemove, 
  enableIndexedDbPersistence,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot, 
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';



// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.log("Multiple tabs open, persistence can only be enabled in one tab at a time");
  } else if (err.code == 'unimplemented') {
    console.log("The current browser doesn't support persistence");
  }
});

// Helper function to ensure userChats document exists
const ensureUserChatsExists = async (userId) => {
  const userChatsRef = doc(db, 'userChats', userId);
  const userChatsSnap = await getDoc(userChatsRef);
  if (!userChatsSnap.exists()) {
    await setDoc(userChatsRef, {
      chatIds: [],
      unreadCount: {}
    });
  }
  return userChatsRef;
};

// Chat Service Implementation
const ChatService = {
  createDirectChat: async (userId1, userId2) => {
    const participants = [userId1, userId2].sort();
    const chatId = participants.join('_');
    
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      return chatId;
    }
    
    const newChat = {
      chatId,
      type: 'direct',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants,
      lastMessage: null
    };
    
    await setDoc(chatRef, newChat);
    
    // Ensure userChats documents exist
    await Promise.all([
      ensureUserChatsExists(userId1),
      ensureUserChatsExists(userId2)
    ]);
    
    // Update userChats for both users
    const batch = writeBatch(db);
    batch.update(doc(db, 'userChats', userId1), {
      chatIds: arrayUnion(chatId),
      [`unreadCount.${chatId}`]: 0
    });
    
    batch.update(doc(db, 'userChats', userId2), {
      chatIds: arrayUnion(chatId),
      [`unreadCount.${chatId}`]: 0
    });
    
    await batch.commit();
    
    return chatId;
  },

  createGroupChat: async (creatorId, participantIds, groupName) => {
    const chatId = doc(collection(db, 'chats')).id;
    const participants = [...new Set([creatorId, ...participantIds])];
    
    const newChat = {
      chatId,
      type: 'group',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants,
      groupName,
      lastMessage: null
    };
    
    await setDoc(doc(db, 'chats', chatId), newChat);
    
    // Ensure all userChats documents exist
    await Promise.all(participants.map(userId => ensureUserChatsExists(userId)));
    
    // Update userChats for all participants
    const batch = writeBatch(db);
    participants.forEach(userId => {
      batch.update(doc(db, 'userChats', userId), {
        chatIds: arrayUnion(chatId),
        [`unreadCount.${chatId}`]: 0
      });
    });
    
    await batch.commit();
    
    return chatId;
  },

  getUserChats: async (userId) => {
    const userChatsRef = doc(db, 'userChats', userId);
    const userChatsSnap = await getDoc(userChatsRef);
    
    if (!userChatsSnap.exists()) {
      return [];
    }
    
    const chatIds = userChatsSnap.data().chatIds || [];
    
    // Fetch all chats in parallel
    const chatPromises = chatIds.map(chatId => 
      getDoc(doc(db, 'chats', chatId)).then(snap => 
        snap.exists() ? { id: snap.id, ...snap.data() } : null
      )
    );
    
    const chats = (await Promise.all(chatPromises)).filter(chat => chat !== null);
    
    return chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
  },

  // ... (other ChatService methods remain the same)
};

// Message Service Implementation
const MessageService = {
  sendMessage: async (chatId, senderId, message) => {
    const messageId = doc(collection(db, 'messages')).id;
    const messageRef = doc(db, 'messages', messageId);
    const chatRef = doc(db, 'chats', chatId);
    
    let attachments = [];
    if (message.attachments && message.attachments.length > 0) {
      attachments = await Promise.all(message.attachments.map(async (file) => {
        const storageRef = ref(storage, `attachments/${chatId}/${file.name}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return {
          type: file.type,
          url,
          name: file.name
        };
      }));
    }
    
    const newMessage = {
      messageId,
      chatId,
      senderId,
      text: message.text,
      timestamp: serverTimestamp(),
      readBy: [senderId],
      attachments: attachments.length > 0 ? attachments : undefined
    };
    
    const batch = writeBatch(db);
    batch.set(messageRef, newMessage);
    
    // Get chat data first to avoid multiple serverTimestamp() calls
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('Chat does not exist');
    }
    
    const timestamp = serverTimestamp();
    
    // Update chat's last message and timestamp
    batch.update(chatRef, {
      lastMessage: {
        text: message.text,
        timestamp: timestamp,
        senderId
      },
      updatedAt: timestamp
    });
    
    // Increment unread count for all participants except sender
    const participants = chatSnap.data().participants || [];
    participants.forEach((userId) => {
      if (userId !== senderId) {
        const userChatsRef = doc(db, 'userChats', userId);
        batch.update(userChatsRef, {
          [`unreadCount.${chatId}`]: increment(1)
        });
      }
    });
    
    await batch.commit();
    return messageId;
  },

  getChatMessages: async (chatId, limitCount, startAfterId) => {
    const messagesRef = collection(db, 'messages');
    let q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    if (startAfterId) {
      const lastMessageRef = doc(db, 'messages', startAfterId);
      const lastMessageSnap = await getDoc(lastMessageRef);
      if (lastMessageSnap.exists()) {
        q = query(
          messagesRef,
          where('chatId', '==', chatId),
          orderBy('timestamp', 'desc'),
          startAfter(lastMessageSnap),
          limit(limitCount)
        );
      }
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  markMessagesAsRead: async (chatId, userId) => {
    // Alternative approach to avoid 'not-in' limitations
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(100) // Adjust limit as needed
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach(doc => {
      const message = doc.data();
      if (!message.readBy || !message.readBy.includes(userId)) {
        batch.update(doc.ref, {
          readBy: arrayUnion(userId)
        });
        count++;
      }
    });
    
    if (count > 0) {
      // Reset unread count for this chat
      const userChatsRef = doc(db, 'userChats', userId);
      batch.update(userChatsRef, {
        [`unreadCount.${chatId}`]: 0
      });
      
      await batch.commit();
    }
  },

  // ... (other MessageService methods remain the same)
};

// Real-time Service Implementation
const ChatRealTimeService = {
  subscribeToMessages: (chatId, callback) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
    
    return unsubscribe;
  },

  subscribeToChat: (chatId, callback) => {
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
    
    return unsubscribe;
  },

  subscribeToUserChats: (userId, callback) => {
    const userChatsRef = doc(db, 'userChats', userId);
    const unsubscribe = onSnapshot(userChatsRef, async (doc) => {
      if (doc.exists()) {
        const chatIds = doc.data().chatIds || [];
        
        // Fetch all chats in parallel
        const chatPromises = chatIds.map(chatId => 
          getDoc(doc(db, 'chats', chatId)).then(snap => 
            snap.exists() ? { id: snap.id, ...snap.data() } : null
          )
        );
        
        const chats = (await Promise.all(chatPromises)).filter(chat => chat !== null);
        callback(chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  }
};

export { ChatService, MessageService, ChatRealTimeService };