import React from 'react';
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import MainNav from '../components/ResearcherComponents/Navigation/MainNav';
import { logOut } from '../backend/firebase/authFirebase';
import { BrowserRouter } from 'react-router-dom';
import { searchUsers } from '../backend/firebase/viewprofile';
import { useUnreadNotificationsCount, useUnreadMessagesCount } from '../backend/firebase/notificationsUtil';

// Mock the firebase modules
vi.mock('../backend/firebase/authFirebase', () => ({
  logOut: vi.fn(() => Promise.resolve())
}));

vi.mock('../backend/firebase/viewprofile', () => ({
  searchUsers: vi.fn()
}));

vi.mock('../backend/firebase/notificationsUtil', () => ({
  useUnreadNotificationsCount: vi.fn(() => 0),
  useUnreadMessagesCount: vi.fn(() => 0)
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock window.location
delete window.location;
window.location = { href: '' };

// Mock matchMedia for Framer Motion
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => children
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MainNav Component', () => {
  const defaultProps = {
    showForm: false,
    setShowForm: vi.fn(),
    setMobileMenuOpen: vi.fn(),
    mobileMenuOpen: false,
    onSearch: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders all desktop navigation buttons', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('My Projects')).toBeInTheDocument();
    expect(screen.getByLabelText('Documents')).toBeInTheDocument();
    expect(screen.getByLabelText('View messages')).toBeInTheDocument();
    expect(screen.getByLabelText('View alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('View profile')).toBeInTheDocument();
  });

  it('renders the search bar with new functionality', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search people...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays search suggestions when typing', async () => {
    const mockResults = [
      { id: '1', fullName: 'John Doe', role: 'Researcher', institution: 'Test Uni' },
      { id: '2', fullName: 'Jane Smith', role: 'Reviewer', department: 'CS' }
    ];
    searchUsers.mockResolvedValue(mockResults);

    renderWithRouter(<MainNav {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for search results
    await waitFor(() => {
      mockResults.forEach(user => {
        expect(screen.getByText(user.fullName)).toBeInTheDocument();
      });
    });
  });

  it('shows unread notification badges when there are unread items', () => {
    vi.mocked(useUnreadNotificationsCount).mockReturnValue(2);
    vi.mocked(useUnreadMessagesCount).mockReturnValue(3);

    renderWithRouter(<MainNav {...defaultProps} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Notifications badge
    expect(screen.getByText('3')).toBeInTheDocument(); // Messages badge
  });

  it('handles mobile menu toggle correctly', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);
    
    expect(defaultProps.setMobileMenuOpen).toHaveBeenCalledWith(true);
  });

  it('handles logout process correctly', async () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Check if modal appears
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to log out? You'll need to sign in again to access your account.")).toBeInTheDocument();

    // Confirm logout - use getAllByRole to handle multiple buttons
    const confirmButtons = screen.getAllByRole('button', { name: /logout/i });
    const modalLogoutButton = confirmButtons[1]; // The second logout button is in the modal
    
    await act(async () => {
      fireEvent.click(modalLogoutButton);
    });

    expect(logOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });
  });

  it('cancels logout when clicking cancel in modal', () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
  });

  it('navigates correctly when clicking menu items', async () => {
    renderWithRouter(<MainNav {...defaultProps} />);
    
    // Test navigation for each button
    fireEvent.click(screen.getByLabelText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/home');

    fireEvent.click(screen.getByLabelText('My Projects'));
    expect(mockNavigate).toHaveBeenCalledWith('/projects');

    fireEvent.click(screen.getByLabelText('Documents'));
    expect(mockNavigate).toHaveBeenCalledWith('/documents');

    fireEvent.click(screen.getByLabelText('View messages'));
    expect(mockNavigate).toHaveBeenCalledWith('/messages');

    fireEvent.click(screen.getByLabelText('View alerts'));
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');

    fireEvent.click(screen.getByLabelText('View profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/account');
  });
});