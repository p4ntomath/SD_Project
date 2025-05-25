import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import MessagesLayout from '../pages/MessagesLayout';
import { ChatService } from '../backend/firebase/chatDB';
import { auth } from '../backend/firebase/firebaseConfig';


const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const skipMessages = [
      'An update to AssignReviewersModal inside a test was not wrapped in act',
      'When testing, code that causes React state updates should be wrapped into act',
      'ensures that you\'re testing the behavior the user would see in the browser'
    ];

    if (skipMessages.some(msg => args.some(arg => 
      (typeof arg === 'string' && arg.includes(msg)) ||
      (arg?.message && arg.message.includes(msg))
    ))) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const skipMessages = [
      'An update to AssignReviewersModal inside a test was not wrapped in act',
      'When testing, code that causes React state updates should be wrapped into act'
    ];

    if (skipMessages.some(msg => args.some(arg => 
      (typeof arg === 'string' && arg.includes(msg)) ||
      (arg?.message && arg.message.includes(msg))
    ))) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});


// Mock Firebase modules
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

vi.mock('../backend/firebase/chatDB', () => ({
  ChatService: {
    getUserChats: vi.fn()
  }
}));

const mockUseLocation = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    useNavigate: () => mockNavigate
  };
});

describe('MessagesLayout', () => {
  const mockLocation = (pathname) => {
    mockUseLocation.mockReturnValue({ pathname });
  };

  const mockChats = [
    {
      id: 'chat1',
      lastMessage: { timestamp: new Date() }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    ChatService.getUserChats.mockResolvedValue(mockChats);
    mockUseLocation.mockReset();
    mockNavigate.mockReset();
  });

  it('renders messages list on desktop', () => {
    window.innerWidth = 1024;
    mockLocation('/messages');

    render(
      <BrowserRouter>
        <MessagesLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
  });

  it('shows welcome view when no chat is selected on desktop', () => {
    window.innerWidth = 1024;
    mockLocation('/messages');

    render(
      <BrowserRouter>
        <MessagesLayout />
      </BrowserRouter>
    );

    expect(screen.getByText(/welcome to messages/i)).toBeInTheDocument();
    expect(screen.getByText(/select a chat from the sidebar/i)).toBeInTheDocument();
  });

  it('handles window resize events', async () => {
    window.innerWidth = 1024;
    mockLocation('/messages');

    render(
      <BrowserRouter>
        <MessagesLayout />
      </BrowserRouter>
    );

    // Simulate window resize
    window.innerWidth = 768;
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(ChatService.getUserChats).toHaveBeenCalledWith('test-user-id');
    });
  });

  it('loads initial chat on component mount for desktop', async () => {
    window.innerWidth = 1024;
    mockLocation('/messages');

    render(
      <BrowserRouter>
        <MessagesLayout />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(ChatService.getUserChats).toHaveBeenCalledWith('test-user-id');
    });
  });

  it('shows chat view when a chat is selected', () => {
    window.innerWidth = 1024;
    mockLocation('/messages/chat1');

    render(
      <BrowserRouter>
        <MessagesLayout />
      </BrowserRouter>
    );

    expect(screen.queryByText(/welcome to messages/i)).not.toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    window.innerWidth = 1024;
    mockLocation('/messages');
    ChatService.getUserChats.mockRejectedValueOnce(new Error('Failed to load chats'));

    render(
      <BrowserRouter>
        <MessagesLayout />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/select a chat from the sidebar/i)).toBeInTheDocument();
    });
  });
});