import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ResearcherHome from '../pages/ResearcherPages/ResearcherHome';

// Declare mockNavigate before mocks (to avoid hoisting issues)
const mockNavigate = vi.fn();

// Properly mock react-router-dom (with mockNavigate correctly wired)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock firebase auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      callback({ uid: 'test-user-id' });
      return vi.fn(); // unsubscribe mock
    }),
  },
}));

// Mock projectDB
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
}));

// Mock image
vi.mock('../assets/welcomeDisplayImage.jpg', () => ({
  default: 'mocked-image-path',
}));

// Import projectDB mocks AFTER mocking the module
import { fetchProjects } from '../backend/firebase/projectDB';

describe('ResearcherHome', () => {
  const mockProjects = [
    {
      id: '1',
      title: 'Test Project 1',
      description: 'Test Description 1',
      researchField: 'Computer Science',
      goals: [{ text: 'Goal 1', completed: false }],
      availableFunds: 10000,
      usedFunds: 5000,
      status: 'In Progress',
    },
    {
      id: '2',
      title: 'Test Project 2',
      description: 'Test Description 2',
      researchField: 'Biology',
      goals: [{ text: 'Goal 1', completed: true }],
      availableFunds: 20000,
      usedFunds: 15000,
      status: 'Completed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fetchProjects.mockResolvedValue(mockProjects);
  });

  it('renders the researcher home page with navigation and main content', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    expect(screen.getByRole('heading', { name: 'My Projects' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new project/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });


  it('displays project funding information', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('Project Funding')).toBeInTheDocument();
      expect(screen.getByText('R 30,000')).toBeInTheDocument(); // Total available
      expect(screen.getByText('R 20,000')).toBeInTheDocument(); // Total used
    });
  });

  it('handles create project button click', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    const createButton = screen.getByRole('button', { name: 'create new research project' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('create-project-form')).toBeInTheDocument();
    });
  });

  it('handles project card click navigation', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      const card = screen.getByText('Test Project 1').closest('article');
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/projects/1', { state: mockProjects[0] });
    });
  });

  it('displays empty state when no projects exist', async () => {
    fetchProjects.mockResolvedValueOnce([]);
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating a new research project.')).toBeInTheDocument();
    });
  });
});
