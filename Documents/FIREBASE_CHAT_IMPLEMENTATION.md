# Firebase Chat Implementation Guide

## Database Structure

### Firestore Collections

1. **chats**
   ```javascript
   {
     chatId: string,
     type: 'direct' | 'group',
     createdAt: timestamp,
     updatedAt: timestamp,
     lastMessage: {
       text: string,
       timestamp: timestamp,
       senderId: string
     },
     participants: string[], // Array of user IDs
     groupName?: string,    // Only for group chats
     groupAvatar?: string   // Only for group chats
   }
   ```

2. **messages**
   ```javascript
   {
     messageId: string,
     chatId: string,
     senderId: string,
     text: string,
     timestamp: timestamp,
     readBy: string[],
     attachments?: [{
       type: string,
       url: string,
       name: string
     }]
   }
   ```

3. **userChats**
   ```javascript
   {
     userId: string,
     chatIds: string[],
     unreadCount: number
   }
   ```

## Required Backend Methods

### 1. Chat Management

```typescript
interface ChatService {
  // Create a new direct chat between two users
  createDirectChat(userId1: string, userId2: string): Promise<string>;

  // Create a new group chat
  createGroupChat(creatorId: string, participantIds: string[], groupName: string): Promise<string>;

  // Get all chats for a user
  getUserChats(userId: string): Promise<Chat[]>;

  // Add user to group chat
  addUserToGroupChat(chatId: string, userId: string): Promise<void>;

  // Remove user from group chat
  removeUserFromGroupChat(chatId: string, userId: string): Promise<void>;

  // Update group chat details
  updateGroupChatDetails(chatId: string, details: {
    groupName?: string,
    groupAvatar?: string
  }): Promise<void>;
}
```

### 2. Message Management

```typescript
interface MessageService {
  // Send a new message
  sendMessage(chatId: string, senderId: string, message: {
    text: string,
    attachments?: File[]
  }): Promise<string>;

  // Get messages for a chat with pagination
  getChatMessages(chatId: string, limit: number, startAfter?: string): Promise<Message[]>;

  // Mark messages as read
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;

  // Delete message
  deleteMessage(messageId: string, chatId: string): Promise<void>;

  // Get unread messages count
  getUnreadCount(userId: string, chatId: string): Promise<number>;
}
```

## Real-time Implementation

### 1. Firebase Configuration

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

### 2. Real-time Listeners

```typescript
interface ChatRealTimeService {
  // Listen to new messages in a chat
  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void;

  // Listen to chat updates (new messages, participants changes)
  subscribeToChat(chatId: string, callback: (chat: Chat) => void): () => void;

  // Listen to user's chats list
  subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void;
}
```

## Implementation Example

```typescript
// Example of implementing real-time chat listener
const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};
```
## Error Handling

Implement proper error handling for common scenarios:
- User not found
- Chat not found
- Permission denied
- Network issues
- File upload failures

## Offline Support

1. Enable Firebase offline persistence:
```typescript
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
    } else if (err.code == 'unimplemented') {
        // The current browser doesn't support persistence
    }
});
```

2. Implement message queue for offline messages:
- Store pending messages in local storage
- Sync when connection is restored
- Show status indicators for message delivery

## Performance Considerations

1. Implement pagination for message loading
2. Use Firebase indexes for common queries
3. Optimize attachment handling
4. Implement message batching for bulk operations
5. Use Firebase Cloud Functions for heavy operations