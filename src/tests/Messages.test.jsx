import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Messages from '../pages/Messages';

// Set up mocks before any tests run
let mockNavigate;
let mockLocation;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate
  };
});

describe('Messages', () => {
  beforeEach(() => {
    mockNavigate = vi.fn();
    mockLocation = { pathname: '/messages' };
    vi.clearAllMocks();
  });

  const setMockLocation = (path) => {
    mockLocation.pathname = path;
  };

  it('renders messages list when on messages route', () => {
    render(
      <BrowserRouter>
        <Messages />
      </BrowserRouter>
    );

    const messagesList = screen.getByTestId('messages-list');
    expect(messagesList).toBeInTheDocument();
    expect(messagesList).toHaveClass('block');
  });

  it('hides messages list on mobile when viewing a chat', () => {
    setMockLocation('/messages/chat1');
    window.innerWidth = 375; // Mobile width
    
    render(
      <BrowserRouter>
        <Messages />
      </BrowserRouter>
    );

    const messagesList = screen.getByTestId('messages-list');
    expect(messagesList).toHaveClass('hidden md:block');
  });

  it('shows messages list on desktop even when viewing a chat', () => {
    setMockLocation('/messages/chat1');
    window.innerWidth = 1024; // Desktop width
    
    render(
      <BrowserRouter>
        <Messages />
      </BrowserRouter>
    );

    const messagesList = screen.getByTestId('messages-list');
    expect(messagesList).toHaveClass('hidden md:block');
  });

  it('handles window resize events', async () => {
    setMockLocation('/messages');
    window.innerWidth = 375; // Start with mobile
    
    render(
      <BrowserRouter>
        <Messages />
      </BrowserRouter>
    );

    // Simulate resize to desktop
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });
  });

  it('maintains correct layout classes', () => {
    setMockLocation('/messages');
    
    render(
      <BrowserRouter>
        <Messages />
      </BrowserRouter>
    );

    const container = screen.getByTestId('messages-container');
    expect(container).toHaveClass('h-screen', 'bg-gray-50');
    expect(container.firstChild).toHaveClass('h-full', 'md:grid', 'md:grid-cols-[380px_1fr]');
  });

  it('applies correct visibility classes for chat view', () => {
    setMockLocation('/messages/chat1');
    
    render(
      <BrowserRouter>
        <Messages />
      </BrowserRouter>
    );

    const chatView = screen.getByTestId('chat-view');
    expect(chatView).toHaveClass('block');
    expect(chatView).not.toHaveClass('hidden');
  });
});