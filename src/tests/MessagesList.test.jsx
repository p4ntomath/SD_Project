import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import MessagesList from '../pages/MessagesList';
import { ChatService, ChatRealTimeService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';

// Mock modules
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

vi.mock('../backend/firebase/chatDB', () => ({
  ChatService: {
    searchUsers: vi.fn(),
    createDirectChat: vi.fn(),
    createGroupChat: vi.fn()
  },
  ChatRealTimeService: {
    subscribeToUserChats: vi.fn()
  }
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {}
}));

describe('MessagesList', () => {
  const mockChats = [
    {
      id: 'chat1',
      type: 'direct',
      participants: ['test-user-id', 'other-user-id'],
      participantNames: {
        'test-user-id': 'Test User',
        'other-user-id': 'Other User'
      },
      lastMessage: {
        text: 'Hello',
        timestamp: { seconds: Date.now() / 1000 }
      }
    },
    {
      id: 'chat2',
      type: 'group',
      groupName: 'Test Group',
      participants: ['test-user-id', 'user2', 'user3'],
      participantNames: {
        'test-user-id': 'Test User',
        'user2': 'User Two',
        'user3': 'User Three'
      }
    }
  ];

  const mockUsers = [
    {
      id: 'user1',
      fullName: 'User One',
      email: 'user1@example.com'
    },
    {
      id: 'user2',
      fullName: 'User Two',
      email: 'user2@example.com'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    ChatRealTimeService.subscribeToUserChats.mockImplementation((userId, callback) => {
      callback(mockChats);
      return () => {};
    });
    ChatService.searchUsers.mockResolvedValue(mockUsers);
  });

  it('renders chat list', async () => {
    render(
      <BrowserRouter>
        <MessagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });
  });

  it('handles new chat creation', async () => {
    ChatService.createDirectChat.mockResolvedValue('new-chat-id');

    render(
      <BrowserRouter>
        <MessagesList />
      </BrowserRouter>
    );

    // Open new chat modal using test ID
    fireEvent.click(screen.getByTestId('new-chat-button'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();
    });

    // Search for users
    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'user' } });

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    // Start chat with first user
    fireEvent.click(screen.getByText('User One'));

    await waitFor(() => {
      expect(ChatService.createDirectChat).toHaveBeenCalledWith('test-user-id', 'user1');
    });
  });

  it('handles group chat creation', async () => {
    ChatService.createGroupChat.mockResolvedValue('new-group-id');

    render(
      <BrowserRouter>
        <MessagesList />
      </BrowserRouter>
    );

    // Open group chat modal using test ID
    fireEvent.click(screen.getByTestId('group-chat-button'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/group name/i)).toBeInTheDocument();
    });

    // Enter group name and select users
    const nameInput = screen.getByPlaceholderText(/group name/i);
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    const users = await screen.findAllByText(/user /i);
    fireEvent.click(users[0]); // Select first user
    fireEvent.click(users[1]); // Select second user

    // Create group
    fireEvent.click(screen.getByRole('button', { name: /create group chat/i }));

    await waitFor(() => {
      expect(ChatService.createGroupChat).toHaveBeenCalledWith(
        'test-user-id',
        ['user1', 'user2'],
        'New Group'
      );
    });
  });

  it('filters chats by search query', async () => {
    render(
      <BrowserRouter>
        <MessagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search messages/i);
    fireEvent.change(searchInput, { target: { value: 'Group' } });

    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.queryByText('Other User')).not.toBeInTheDocument();
  });

  it('filters chats by type', async () => {
    render(
      <BrowserRouter>
        <MessagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    // Switch to direct chats filter
    fireEvent.click(screen.getByRole('button', { name: /direct/i }));

    expect(screen.queryByText('Test Group')).not.toBeInTheDocument();
    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    // Simulate chat subscription error
    ChatRealTimeService.subscribeToUserChats.mockImplementation(() => {
      throw new Error('Failed to load chats');
    });

    render(
      <BrowserRouter>
        <MessagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no chats found/i)).toBeInTheDocument();
    });
  });
});