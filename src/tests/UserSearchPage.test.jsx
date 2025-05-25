import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (args[0]?.includes('inside a test was not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockSearchParams = new Map();
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [{ get: (key) => mockSearchParams.get(key) }],
  };
});

// Mock navigation components
vi.mock('../components/ResearcherComponents/Navigation/MainNav', () => ({ 
  default: ({ setMobileMenuOpen, mobileMenuOpen }) => (
    <div data-testid="main-nav" onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)} />
  )
}));
vi.mock('../components/ResearcherComponents/Navigation/MobileBottomNav', () => ({ 
  default: () => <div data-testid="mobile-bottom-nav" />
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: ({ color, size = 40 }) => <div data-testid="loading-spinner" style={{ color }} data-size={size} />
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'current-user-id', fullName: 'Current User' } })
}));

// Mock Firebase services
vi.mock('../backend/firebase/viewprofile', () => ({
  searchUsers: vi.fn()
}));
vi.mock('../backend/firebase/chatDB', () => ({
  ChatService: {
    createDirectChat: vi.fn()
  }
}));
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'current-user-id' } }
}));

import UserSearchPage from '../pages/UserSearchPage';
import { searchUsers } from '../backend/firebase/viewprofile';
import { ChatService } from '../backend/firebase/chatDB';

describe('UserSearchPage', () => {
  const mockUsers = [
    {
      id: 'user1',
      fullName: 'John Smith',
      role: 'researcher',
      institution: 'MIT',
      department: 'Computer Science',
      fieldOfResearch: 'Machine Learning',
      profilePicture: 'https://example.com/john.jpg'
    },
    {
      id: 'user2', 
      fullName: 'Jane Doe',
      role: 'reviewer',
      institution: 'Stanford',
      department: 'Biology',
      profilePicture: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    searchUsers.mockClear();
    ChatService.createDirectChat.mockClear();
    mockNavigate.mockClear();
    mockSearchParams = new Map();
  });

  it('renders search form correctly', () => {
    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Search users')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search researchers and reviewers...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('searches for users on input with debounce', async () => {
    searchUsers.mockResolvedValue(mockUsers);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    // Should not search immediately
    expect(searchUsers).not.toHaveBeenCalled();

    // Should search after debounce delay
    await waitFor(() => {
      expect(searchUsers).toHaveBeenCalledWith('john', 1, 10);
    }, { timeout: 500 });
  });

  it('displays search results correctly', async () => {
    searchUsers.mockResolvedValue(mockUsers);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    // Check user details
    expect(screen.getByText('Researcher')).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
    expect(screen.getByText('MIT • Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Stanford • Biology')).toBeInTheDocument();
  });

  it('shows profile picture when available', async () => {
    searchUsers.mockResolvedValue([mockUsers[0]]);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      const profileImg = screen.getByAltText("John Smith's profile");
      expect(profileImg).toBeInTheDocument();
      expect(profileImg).toHaveAttribute('src', 'https://example.com/john.jpg');
    });
  });

  it('shows initials when no profile picture', async () => {
    searchUsers.mockResolvedValue([mockUsers[1]]);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'jane' } });

    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument(); // Jane Doe initials
    });
  });

  it('navigates to user profile when clicked', async () => {
    searchUsers.mockResolvedValue([mockUsers[0]]);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      const userCard = screen.getByText('John Smith').closest('article');
      fireEvent.click(userCard);
      expect(mockNavigate).toHaveBeenCalledWith('/profile/user1');
    });
  });

  it('creates chat when message button is clicked', async () => {
    searchUsers.mockResolvedValue([mockUsers[0]]);
    ChatService.createDirectChat.mockResolvedValue('chat123');

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      const messageButton = screen.getByText('Message');
      fireEvent.click(messageButton);
    });

    expect(ChatService.createDirectChat).toHaveBeenCalledWith('current-user-id', 'user1');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/messages/chat123');
    });
  });

  it('shows loading spinner during search', async () => {
    searchUsers.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('shows error message on search failure', async () => {
    searchUsers.mockRejectedValue(new Error('Search failed'));

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('Failed to search users. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows no results message when search returns empty', async () => {
    searchUsers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('loads more users when load more button is clicked', async () => {
    const initialUsers = Array.from({ length: 10 }, (_, i) => ({
      id: `user${i}`,
      fullName: `User ${i}`,
      role: 'researcher'
    }));
    const moreUsers = Array.from({ length: 5 }, (_, i) => ({
      id: `user${i + 10}`,
      fullName: `User ${i + 10}`,
      role: 'researcher'
    }));

    searchUsers
      .mockResolvedValueOnce(initialUsers)
      .mockResolvedValueOnce(moreUsers);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText('Search users');
    fireEvent.change(searchInput, { target: { value: 'user' } });

    await waitFor(() => {
      expect(screen.getByText('Load more')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Load more');
    fireEvent.click(loadMoreButton);

    expect(searchUsers).toHaveBeenCalledWith('user', 2, 10); // Page 2
  });

  it('initializes search from URL query parameter', async () => {
    mockSearchParams.set('q', 'initial search');
    searchUsers.mockResolvedValue(mockUsers);

    render(
      <MemoryRouter>
        <UserSearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(searchUsers).toHaveBeenCalledWith('initial search', 1, 10);
      expect(screen.getByDisplayValue('initial search')).toBeInTheDocument();
    });
  });
});