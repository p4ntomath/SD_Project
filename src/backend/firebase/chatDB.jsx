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
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot, 
  serverTimestamp,
  increment,
  writeBatch,
  CACHE_SIZE_UNLIMITED,
  deleteField
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

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

// Error handling wrapper
const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'permission-denied':
      throw new Error('You do not have permission to perform this action');
    case 'not-found':
      throw new Error('The requested resource was not found');
    case 'failed-precondition':
      throw new Error('Operation failed due to the current state of the system');
    default:
      throw new Error('An unexpected error occurred: ' + error.message);
  }
};

// Enhanced ChatService with explicit group chat management
const ChatService = {
  createDirectChat: async (userId1, userId2) => {
    try {
      // Check if users exist first
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, 'users', userId1)),
        getDoc(doc(db, 'users', userId2))
      ]);

      if (!user1Doc.exists() || !user2Doc.exists()) {
        throw new Error('One or more users not found');
      }

      const participants = [userId1, userId2].sort();
      const chatId = participants.join('_');
      
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        return chatId;
      }

      const user1Data = user1Doc.data();
      const user2Data = user2Doc.data();
      
      const newChat = {
        chatId,
        type: 'direct',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants,
        participantNames: {
          [userId1]: user1Data.fullName,
          [userId2]: user2Data.fullName
        },
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
    } catch (error) {
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to start this chat');
      }
      throw error;
    }
  },

  createGroupChat: async (creatorId, participantIds, groupName) => {
    const chatId = doc(collection(db, 'chats')).id;
    const participants = [...new Set([creatorId, ...participantIds])];
    
    // Get all participant names
    const participantNames = {};
    await Promise.all(
      participants.map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          participantNames[userId] = userSnap.data().fullName || 'Unknown User';
        } else {
          participantNames[userId] = 'Unknown User';
        }
      })
    );
    
    const newChat = {
      chatId,
      type: 'group',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants,
      participantNames,
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

  addUserToGroupChat: async (chatId, userId) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error('Chat does not exist');
      }
      
      if (chatSnap.data().type !== 'group') {
        throw new Error('This is not a group chat');
      }

      // Get new user's name
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists() ? userSnap.data().fullName || 'Unknown User' : 'Unknown User';
      
      const batch = writeBatch(db);
      
      // Add user to chat participants and update participantNames
      batch.update(chatRef, {
        participants: arrayUnion(userId),
        [`participantNames.${userId}`]: userName
      });
      
      // Add chat to user's chats
      const userChatsRef = doc(db, 'userChats', userId);
      batch.update(userChatsRef, {
        chatIds: arrayUnion(chatId),
        [`unreadCount.${chatId}`]: 0
      });
      
      await batch.commit();
    } catch (error) {
      handleFirebaseError(error);
    }
  },

  removeUserFromGroupChat: async (chatId, userId) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error('Chat does not exist');
      }
      
      if (chatSnap.data().type !== 'group') {
        throw new Error('This is not a group chat');
      }
      
      const batch = writeBatch(db);
      
      // Remove user from chat participants
      batch.update(chatRef, {
        participants: arrayRemove(userId)
      });
      
      // Remove chat from user's chats
      const userChatsRef = doc(db, 'userChats', userId);
      batch.update(userChatsRef, {
        chatIds: arrayRemove(chatId),
        [`unreadCount.${chatId}`]: deleteField()
      });
      
      await batch.commit();
    } catch (error) {
      handleFirebaseError(error);
    }
  },

  updateGroupChatDetails: async (chatId, details) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error('Chat does not exist');
      }
      
      if (chatSnap.data().type !== 'group') {
        throw new Error('This is not a group chat');
      }
      
      await updateDoc(chatRef, {
        ...details,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirebaseError(error);
    }
  },

  getGroupChatMembers: async (chatId) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        throw new Error('Chat does not exist');
      }
      
      if (chatSnap.data().type !== 'group') {
        throw new Error('This is not a group chat');
      }
      
      return chatSnap.data().participants;
    } catch (error) {
      handleFirebaseError(error);
    }
  },

  searchUsers: async (searchTerm, currentUserId) => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const searchResults = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.id !== currentUserId && // Exclude current user
          (user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      return searchResults;
    } catch (error) {
      handleFirebaseError(error);
    }
  },
};

// Enhanced MessageService with error handling
const MessageService = {
  sendMessage: async (chatId, senderId, message) => {
    try {
      const messageId = doc(collection(db, 'messages')).id;
      const messageRef = doc(db, 'messages', messageId);
      const chatRef = doc(db, 'chats', chatId);
      const batch = writeBatch(db);
      
      const timestamp = serverTimestamp();
      const clientTimestamp = new Date(); // Add client-side timestamp
      
      const newMessage = {
        chatId,
        senderId,
        text: message.text,
        timestamp,
        clientTimestamp, // Add client timestamp for immediate sorting
        readBy: [senderId],
        readTimestamps: {
          [senderId]: timestamp
        },
        attachments: message.attachments || []
      };

      batch.set(messageRef, newMessage);
      
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        throw new Error('Chat does not exist');
      }
      
      // Update chat with both server and client timestamps
      batch.update(chatRef, {
        lastMessage: {
          text: message.text,
          timestamp,
          clientTimestamp,
          senderId
        },
        updatedAt: timestamp,
        clientUpdatedAt: clientTimestamp // Add client timestamp for immediate sorting
      });
      
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
    } catch (error) {
      handleFirebaseError(error);
    }
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
    // Get messages that haven't been read by this user
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;
    
    const timestamp = serverTimestamp();
    
    snapshot.forEach(doc => {
      const message = doc.data();
      // Only mark as read if user hasn't read it yet
      if (!message.readBy || !message.readBy.includes(userId)) {
        batch.update(doc.ref, {
          readBy: arrayUnion(userId),
          [`readTimestamps.${userId}`]: timestamp
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
    
    try {
      // Create a query for the most recent messages
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      // Set up real-time listener
      return onSnapshot(q, 
        (snapshot) => {
          const messages = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              // Ensure timestamp and readTimestamps are properly handled
              timestamp: doc.data().timestamp?.toDate?.() || new Date(),
              readTimestamps: doc.data().readTimestamps || {},
              readBy: doc.data().readBy || []
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort in descending order (newest first)
          
          callback(messages);
        },
        (error) => {
          console.error('Error in messages subscription:', error);
          if (error.code === 'failed-precondition') {
            const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
            console.error('This query requires an index. Please create it at:', indexUrl?.[0]);
          }
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up messages subscription:', error);
      return () => {};
    }
  },

  subscribeToChat: (chatId, callback) => {
    const chatRef = doc(db, 'chats', chatId);
    
    const unsubscribe = onSnapshot(chatRef, async (snapshot) => {
      if (snapshot.exists()) {
        const chatData = snapshot.data();
        
        // Initialize participantNames if missing
        if (!chatData.participantNames) {
          chatData.participantNames = {};
        }
        
        // Check for any missing participant names
        const missingParticipants = chatData.participants.filter(
          userId => !chatData.participantNames[userId]
        );
        
        if (missingParticipants.length > 0) {
          const batch = writeBatch(db);
          
          // Fetch missing user names
          for (const userId of missingParticipants) {
            try {
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);
              const fullName = userSnap.exists() ? userSnap.data()?.fullName : null;
              chatData.participantNames[userId] = fullName || 'Unknown User';
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              chatData.participantNames[userId] = 'Unknown User';
            }
          }
          
          // Update chat with all participant names
          await updateDoc(chatRef, { participantNames: chatData.participantNames });
        }
        
        callback({ id: snapshot.id, ...chatData });
      } else {
        callback(null);
      }
    });
    
    return unsubscribe;
  },

  subscribeToUserChats: (userId, callback) => {
    const userChatsRef = doc(db, 'userChats', userId);
    
    // Listen to changes in the user's chat list
    const unsubscribe = onSnapshot(userChatsRef, (docSnapshot) => {
      if (!docSnapshot.exists()) {
        callback([]);
        return;
      }

      const userData = docSnapshot.data();
      const chatIds = userData.chatIds || [];
      const unreadCounts = userData.unreadCount || {};
      
      if (chatIds.length === 0) {
        callback([]);
        return;
      }

      // Create a query to listen to all relevant chats
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('chatId', 'in', chatIds));
      
      // Set up real-time listener for chats
      const unsubscribeChats = onSnapshot(q, (querySnapshot) => {
        const chats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          unreadCount: unreadCounts[doc.id] || 0
        }))
        .sort((a, b) => {
          // First try to sort by client timestamp
          const aClientTime = a.lastMessage?.clientTimestamp?.toMillis?.() || 0;
          const bClientTime = b.lastMessage?.clientTimestamp?.toMillis?.() || 0;
          
          if (aClientTime !== bClientTime) {
            return bClientTime - aClientTime;
          }
          
          // Fall back to server timestamp if client timestamps are equal
          const aTime = a.lastMessage?.timestamp?.seconds || a.updatedAt?.seconds || 0;
          const bTime = b.lastMessage?.timestamp?.seconds || b.updatedAt?.seconds || 0;
          return bTime - aTime;
        });
        
        callback(chats);
      });

      // Return cleanup function that unsubscribes from both listeners
      return () => {
        unsubscribe();
        unsubscribeChats?.();
      };
    });

    return unsubscribe;
  }
};

export { ChatService, MessageService, ChatRealTimeService };