import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as firestoreModule from 'firebase/firestore';

// Mock react-router-dom useParams
const mockParams = { userId: 'user123' };
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useParams: () => mockParams,
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
  ClipLoader: ({ color }) => <div data-testid="loading-spinner" style={{ color }} />
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
  };
});

// Mock firebase config
vi.mock('../backend/firebase/firebaseConfig', () => ({
  db: {}
}));

import PublicProfilePage from '../pages/PublicProfilePage';

describe('PublicProfilePage', () => {
  const mockUser = {
    id: 'user123',
    fullName: 'John Doe',
    role: 'researcher',
    bio: 'A passionate researcher in AI',
    institution: 'University of Science',
    department: 'Computer Science',
    location: 'New York, NY',
    fieldOfResearch: 'Artificial Intelligence and Machine Learning',
    profilePicture: 'https://example.com/profile.jpg',
    createdAt: { seconds: 1640995200 } // Jan 1, 2022
  };

  const mockProject = {
    id: 'proj1',
    title: 'AI Research Project',
    description: 'Advanced AI research',
    status: 'In Progress',
    researchField: 'AI',
    deadline: { seconds: 1735689600 }, // Jan 1, 2025
    userId: 'user123',
    visibility: 'public'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    // Mock pending async calls
    firestoreModule.getDoc.mockReturnValue(new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows profile not found when user does not exist', async () => {
    firestoreModule.getDoc.mockResolvedValue({ exists: () => false });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });
  });

  it('renders user profile with all information', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });
    firestoreModule.getDocs.mockResolvedValue({ docs: [] });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check role badge
    expect(screen.getByText('Researcher')).toBeInTheDocument();
    
    // Check profile information
    expect(screen.getByText('A passionate researcher in AI')).toBeInTheDocument();
    expect(screen.getByText('University of Science')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    
    // Check member since date
    expect(screen.getByText(/Member since January 2022/)).toBeInTheDocument();
    
    // Check research focus section
    expect(screen.getByText('Research Focus')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence and Machine Learning')).toBeInTheDocument();
  });

  it('renders profile picture when available', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });
    firestoreModule.getDocs.mockResolvedValue({ docs: [] });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const profileImg = screen.getByAltText('John Doe');
      expect(profileImg).toBeInTheDocument();
      expect(profileImg).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });
  });

  it('renders initials when no profile picture', async () => {
    const userWithoutPicture = { ...mockUser, profilePicture: null };
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => userWithoutPicture
    });
    firestoreModule.getDocs.mockResolvedValue({ docs: [] });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
    });
  });

  it('renders owned and collaborated projects', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });

    const ownedProjectDoc = {
      id: 'proj1',
      data: () => ({ ...mockProject, userId: 'user123' })
    };

    const collaboratedProjectDoc = {
      id: 'proj2',
      data: () => ({
        ...mockProject,
        id: 'proj2',
        title: 'Collaboration Project',
        userId: 'otherUser',
        collaborators: [{ id: 'user123', name: 'John Doe' }]
      })
    };

    // Mock getDocs to return both owned and collaborated projects
    firestoreModule.getDocs
      .mockResolvedValueOnce({ docs: [ownedProjectDoc] }) // First call for owned projects
      .mockResolvedValueOnce({ docs: [collaboratedProjectDoc] }); // Second call for all projects

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Research Projects')).toBeInTheDocument();
      expect(screen.getByText('Projects Owned')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Advanced AI research')).toBeInTheDocument();
    });
  });

  it('shows no projects message when user has no public projects', async () => {
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => mockUser
    });
    firestoreModule.getDocs.mockResolvedValue({ docs: [] });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Research Projects')).not.toBeInTheDocument();
    });
  });

  it('does not show research focus for non-researcher roles', async () => {
    const reviewerUser = { ...mockUser, role: 'reviewer', fieldOfResearch: 'Some field' };
    firestoreModule.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => reviewerUser
    });
    firestoreModule.getDocs.mockResolvedValue({ docs: [] });

    render(
      <MemoryRouter>
        <PublicProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Reviewer')).toBeInTheDocument();
      expect(screen.queryByText('Research Focus')).not.toBeInTheDocument();
    });
  });
});