import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as firestoreModule from 'firebase/firestore';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { userId: 'user123' };
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate,
  };
});

// Mock navigation components
vi.mock('../components/AdminComponents/Navigation/AdminMainNav', () => ({ 
  default: ({ setMobileMenuOpen, mobileMenuOpen }) => (
    <div data-testid="admin-main-nav" onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)} />
  )
}));
vi.mock('../components/AdminComponents/Navigation/AdminMobileBottomNav', () => ({ 
  default: () => <div data-testid="admin-mobile-bottom-nav" />
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: ({ color }) => <div data-testid="loading-spinner" style={{ color }} />
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
  };
});

// Mock firebase config
vi.mock('../backend/firebase/firebaseConfig', () => ({
  db: {}
}));

import UserDetailsPage from '../pages/UserDetailsPage';

describe('UserDetailsPage', () => {
  const mockUser = {
    id: 'user123',
    fullName: 'Jane Smith',
    email: 'jane.smith@university.edu',
    role: 'researcher',
    status: 'active',
    institution: 'MIT',
    department: 'Computer Science',
    fieldOfResearch: 'Machine Learning',
    bio: 'Passionate researcher in artificial intelligence and machine learning.',
    profilePicture: 'https://example.com/jane.jpg',
    createdAt: { seconds: 1640995200 } // Jan 1, 2022
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    firestoreModule.getDoc.mockReturnValue(new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows user not found when user does not exist', async () => {
    firestoreModule.getDoc.mockResolvedValue({ exists: () => false });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
      expect(screen.getByText('Back to Users List')).toBeInTheDocument();
    });
  });

  it('navigates back to users list when user not found', async () => {
    firestoreModule.getDoc.mockResolvedValue({ exists: () => false });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const backButton = screen.getByText('Back to Users List');
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('renders complete user profile with all information', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check status badge
    expect(screen.getByText('active')).toBeInTheDocument();
    
    // Check basic information
    expect(screen.getByText('jane.smith@university.edu')).toBeInTheDocument();
    expect(screen.getByText('researcher')).toBeInTheDocument();
    
    // Check institution details
    expect(screen.getByText('MIT')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    
    // Check research information (only for researchers)
    expect(screen.getByText('Research Information')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    
    // Check biography
    expect(screen.getByText('Passionate researcher in artificial intelligence and machine learning.')).toBeInTheDocument();
    
    // Check join date
    expect(screen.getByText(/January 1, 2022/)).toBeInTheDocument();
  });

  it('renders profile picture when available', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const profileImg = screen.getByAltText("Jane Smith's profile");
      expect(profileImg).toBeInTheDocument();
      expect(profileImg).toHaveAttribute('src', 'https://example.com/jane.jpg');
    });
  });

  it('renders initials when no profile picture', async () => {
    const userWithoutPicture = { ...mockUser, profilePicture: null };
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => userWithoutPicture
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith initials
    });
  });

  it('does not show research information for non-researcher roles', async () => {
    const adminUser = { ...mockUser, role: 'admin', fieldOfResearch: 'Some field' };
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => adminUser
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.queryByText('Research Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Field of Research:')).not.toBeInTheDocument();
    });
  });

  it('handles missing optional fields gracefully', async () => {
    const minimalUser = {
      id: 'user123',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'reviewer'
    };
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => minimalUser
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();// Institution
      expect(screen.getByText('No biography provided')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument(); // Default status
    });
  });

  it('navigates back to users list when back button is clicked', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const backButton = screen.getAllByText('Back to Users List')[0]; // Get the first one from navigation
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('renders different status badges correctly', async () => {
    const inactiveUser = { ...mockUser, status: 'inactive' };
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => inactiveUser
    });

    render(
      <MemoryRouter>
        <UserDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });
});