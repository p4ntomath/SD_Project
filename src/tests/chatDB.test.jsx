import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService, MessageService, ChatRealTimeService } from '../backend/firebase/chatDB';
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
  deleteField
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Mock imageUtils module completely
vi.mock('../utils/imageUtils', () => ({
  generateThumbnail: vi.fn(() => Promise.resolve('mock-thumbnail-url')),
  getImageDimensions: vi.fn(() => Promise.resolve({ width: 100, height: 100 }))
}));

// Mock HTML5 APIs
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
};

class MockFile extends Blob {
  constructor(bits, name, options = {}) {
    super(bits, options);
    this.name = name;
    this.lastModified = Date.now();
  }
}

global.File = MockFile;

global.FileReader = class {
  constructor() {
    this.readAsDataURL = function(blob) {
      setTimeout(() => {
        this.result = 'data:mock/type;base64,mockdata';
        this.onload?.({ target: { result: this.result } });
      }, 0);
    };
  }
};

// Mock Firebase storage with all required methods
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(() => 'mockStorageRef'),
  uploadBytes: vi.fn(() => Promise.resolve({
    ref: 'mockStorageRef'
  })),
  uploadBytesResumable: vi.fn(() => ({
    on: (event, onProgress, onError, onComplete) => {
      onProgress({ bytesTransferred: 100, totalBytes: 100 });
      onComplete();
      return () => {};
    },
    snapshot: {
      ref: 'mockStorageRef',
      state: 'success'
    }
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('mock-url'))
}));

// Mock Firestore with immediate message snapshot
vi.mock('firebase/firestore', () => {
  const mockBatch = {
    set: vi.fn(() => mockBatch),
    update: vi.fn(() => mockBatch),
    commit: vi.fn(() => Promise.resolve())
  };

  const mockMessageDoc = {
    id: 'msg1',
    data: () => ({
      text: 'Hello',
      timestamp: { toDate: () => new Date() }
    })
  };

  return {
    getFirestore: vi.fn(),
    collection: vi.fn(() => 'mockCollection'),
    doc: vi.fn(() => ({
      id: 'mockId'
    })),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({}),
      id: 'mockId'
    })),
    getDocs: vi.fn(() => Promise.resolve({
      docs: [],
      forEach: vi.fn()
    })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    arrayUnion: vi.fn(data => data),
    arrayRemove: vi.fn(data => data),
    query: vi.fn(collection => collection),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    onSnapshot: vi.fn((ref, callback) => {
      if (typeof ref === 'function') {
        // For message subscription, call immediately
        callback({
          empty: false,
          docs: [mockMessageDoc],
          forEach: (fn) => fn(mockMessageDoc)
        });
      } else {
        // For chat subscription
        callback({
          exists: () => true,
          data: () => ({
            name: 'Test Chat',
            participants: ['user1', 'user2'],
            type: 'group',
            groupName: 'Test Group',
            participantNames: {
              user1: 'Unknown User',
              user2: 'Unknown User'
            }
          }),
          id: 'chat1'
        });
      }
      return () => {};
    }),
    serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
    increment: vi.fn(n => n),
    writeBatch: vi.fn(() => mockBatch),
    deleteField: vi.fn()
  };
});

vi.mock('../backend/firebase/firebaseConfig', () => ({
  db: {},
  storage: {}
}));

describe('ChatService', () => {
  const mockUser1 = {
    uid: 'user1',
    fullName: 'User One'
  };

  const mockUser2 = {
    uid: 'user2',
    fullName: 'User Two'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDirectChat', () => {
    it('should create a new direct chat between two users', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockUser1 })
        .mockResolvedValueOnce({ exists: () => true, data: () => mockUser2 })
        .mockResolvedValueOnce({ exists: () => false });

      const chatId = await ChatService.createDirectChat(mockUser1.uid, mockUser2.uid);
      
      expect(chatId).toBeDefined();
      expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        type: 'direct',
        participants: [mockUser1.uid, mockUser2.uid].sort()
      }));
    });

    it('should throw error if user does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false });

      await expect(ChatService.createDirectChat(mockUser1.uid, mockUser2.uid))
        .rejects
        .toThrow('One or more users not found');
    });
  });

  describe('createGroupChat', () => {
    it('should create a new group chat', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockUser1 })
        .mockResolvedValueOnce({ exists: () => true, data: () => mockUser2 })
        .mockResolvedValue({ exists: () => false }); // For userChats checks

      const participants = [mockUser1.uid, mockUser2.uid];
      const groupName = 'Test Group';

      const chatId = await ChatService.createGroupChat(mockUser1.uid, participants, groupName);
      
      expect(chatId).toBeDefined();
      expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        type: 'group',
        groupName,
        participants: expect.arrayContaining(participants)
      }));
    });
  });
});

describe('MessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a text message', async () => {
      const mockBatch = writeBatch();
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          participants: ['user1', 'user2']
        })
      });

      const message = {
        text: 'Hello world'
      };

      const messageId = await MessageService.sendMessage('chat1', 'user1', message);

      expect(messageId).toBeDefined();
      expect(mockBatch.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        text: message.text,
        senderId: 'user1',
        chatId: 'chat1'
      }));
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          data: () => ({
            readBy: ['user2']
          }),
          ref: { id: 'msg1' }
        },
        {
          id: 'msg2',
          data: () => ({
            readBy: []
          }),
          ref: { id: 'msg2' }
        }
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({ 
        forEach: fn => mockMessages.forEach(fn),
        docs: mockMessages
      });

      const mockBatch = writeBatch();
      await MessageService.markMessagesAsRead('chat1', 'user1');

      // Three updates total: two for messages and one for unreadCount
      expect(mockBatch.update).toHaveBeenCalledTimes(3);
      
      // Verify each update call
      expect(mockBatch.update).toHaveBeenNthCalledWith(1, 
        { id: 'msg1' },
        expect.objectContaining({
          readBy: 'user1',
          'readTimestamps.user1': expect.any(Object)
        })
      );

      expect(mockBatch.update).toHaveBeenNthCalledWith(2, 
        { id: 'msg2' },
        expect.objectContaining({
          readBy: 'user1',
          'readTimestamps.user1': expect.any(Object)
        })
      );

      expect(mockBatch.update).toHaveBeenNthCalledWith(3, 
        { id: 'mockId' },
        expect.objectContaining({
          'unreadCount.chat1': 0
        })
      );
    });
  });


});

describe('ChatRealTimeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribeToMessages', () => {
    it('should set up message subscription', () => {
      const callback = vi.fn();
      
      ChatRealTimeService.subscribeToMessages('chat1', callback);

      expect(query).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe('subscribeToChat', () => {
    it('should set up chat subscription', async () => {
      const callback = vi.fn();
      
      ChatRealTimeService.subscribeToChat('chat1', callback);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(doc).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        id: 'chat1',
        name: 'Test Chat',
        participants: ['user1', 'user2'],
        type: 'group',
        groupName: 'Test Group',
        participantNames: expect.any(Object)
      }));
    });
  });
});