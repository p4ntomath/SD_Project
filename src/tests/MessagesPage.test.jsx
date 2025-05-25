import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import MessagesPage from '../pages/MessagesPage';

describe('MessagesPage', () => {
  beforeEach(() => {
    // Reset viewport width before each test
    window.innerWidth = 1024;
  });

  it('renders sidebar with all navigation items', () => {
    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>
    );

    // Sidebar header
    expect(screen.getByText('Messages')).toBeInTheDocument();

    // Navigation links within sidebar nav
    const nav = screen.getByRole('navigation');
    ['Compose', 'Inbox', 'Sent', 'Starred', 'Archived', 'Trash'].forEach(label => {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    });
  });

  it('renders the main header and empty state when inbox is empty', () => {
    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>
    );

    // Main header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Inbox');

    // Empty state content
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Your inbox is empty\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compose message/i })).toBeInTheDocument();
  });

  it('toggles sidebar collapse state when collapse button is clicked', () => {
    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>
    );

    // Sidebar header is visible initially
    expect(screen.getByText('Messages')).toBeInTheDocument();

    // Find collapse button (SVG button)
    const button = screen.getByRole('button', { name: '' });
    fireEvent.click(button);

    // After collapse, sidebar title should be hidden
    expect(screen.queryByText('Messages')).not.toBeInTheDocument();
  });
});