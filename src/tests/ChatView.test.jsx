import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ChatView from '../pages/ChatView';
import { ChatService, MessageService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';

// Mock modules
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ chatId: 'test-chat-id' }),
    useNavigate: () => vi.fn()
  };
});

vi.mock('../backend/firebase/chatDB', () => ({
  ChatService: {
    getUserChats: vi.fn(),
    updateGroupChatDetails: vi.fn(),
    addUserToGroupChat: vi.fn(),
    removeUserFromGroupChat: vi.fn(),
    searchUsers: vi.fn()
  },
  MessageService: {
    sendMessage: vi.fn(),
    markMessagesAsRead: vi.fn()
  },
  ChatRealTimeService: {
    subscribeToChat: vi.fn(),
    subscribeToMessages: vi.fn()
  }
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {}
}));

vi.mock('emoji-picker-react', () => ({
  default: () => <div data-testid="emoji-picker">Emoji Picker</div>
}));

describe('ChatView', () => {
  const mockChat = {
    id: 'test-chat-id',
    type: 'group',
    groupName: 'Test Group',
    participants: ['test-user-id', 'other-user-id'],
    participantNames: {
      'test-user-id': 'Test User',
      'other-user-id': 'Other User'
    }
  };

  const mockMessages = [
    {
      id: 'msg1',
      senderId: 'test-user-id',
      text: 'Hello world',
      timestamp: { seconds: Date.now() / 1000 }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    
    // Setup default mock implementations
    ChatService.getUserChats.mockResolvedValue([mockChat]);
    ChatRealTimeService.subscribeToChat.mockImplementation((_chatId, callback) => {
      callback(mockChat);
      return () => {};
    });
    ChatRealTimeService.subscribeToMessages.mockImplementation((_chatId, callback) => {
      callback(mockMessages);
      return () => {};
    });
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <ChatView />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/loading chat/i)).toBeInTheDocument();
  });

  it('renders chat interface after loading', async () => {
    render(
      <BrowserRouter>
        <ChatView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });
    
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  

  

  it('handles file attachments', async () => {
    render(
      <BrowserRouter>
        <ChatView />
      </BrowserRouter>
    );

    // Wait for chat to load
    await waitFor(() => {
      expect(screen.queryByText(/loading chat/i)).not.toBeInTheDocument();
    });

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('handles emoji picker toggling', async () => {
    render(
      <BrowserRouter>
        <ChatView />
      </BrowserRouter>
    );

    // Wait for chat to load
    await waitFor(() => {
      expect(screen.queryByText(/loading chat/i)).not.toBeInTheDocument();
    });

    const emojiButton = screen.getByRole('button', { name: /emoji/i });
    fireEvent.click(emojiButton);

    await waitFor(() => {
      expect(screen.getByLabelText('emoji')).toBeInTheDocument();
    });

    fireEvent.click(emojiButton);
    
    await waitFor(() => {
        expect(screen.getByLabelText('emoji')).toBeInTheDocument();
    });
  });

  it('marks messages as read when chat is visible and focused', async () => {
    render(
      <BrowserRouter>
        <ChatView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(MessageService.markMessagesAsRead).toHaveBeenCalledWith(
        'test-chat-id',
        'test-user-id'
      );
    });
  });
});