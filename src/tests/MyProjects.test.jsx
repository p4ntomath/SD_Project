import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';
import MyProjects from '../pages/MyProjects';
import AuthContext from '../context/AuthContext';
import * as projectDB from '../backend/firebase/projectDB';

// Mock Firebase Auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'testUser123' },
    onAuthStateChanged: vi.fn((callback) => {
      callback({ uid: 'testUser123' });
      return () => {};
    })
  }
}));

// Mock React Router's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock project database functions
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn()
}));

describe('MyProjects Component', () => {
  const mockProjects = [
    {
      id: '1',
      title: 'Test Project 1',
      description: 'Description 1',
      status: 'In Progress',
      researchField: 'Computer Science',
      goals: [{ text: 'Goal 1', completed: false }],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Test Project 2',
      description: 'Description 2',
      status: 'Completed',
      researchField: 'Biology',
      goals: [{ text: 'Goal 1', completed: true }],
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    projectDB.fetchProjects.mockResolvedValue(mockProjects);
  });

  const renderWithContext = (ui) => {
    return render(
      <AuthContext.Provider value={{ user: { uid: 'testUser123' }, role: 'researcher' }}>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders loading state initially', () => {
    renderWithContext(<MyProjects />);
    expect(screen.getByTestId('my-projects')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  it('displays projects after loading', async () => {
    renderWithContext(<MyProjects />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });
  });

  it('shows create project form when button is clicked', async () => {
    renderWithContext(<MyProjects />);
    
    const createButton = screen.getByText('Create Project');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('create-project-form')).toBeInTheDocument();
    });
  });

  it('displays no projects message when there are no projects', async () => {
    projectDB.fetchProjects.mockResolvedValueOnce([]);
    renderWithContext(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating a new research project.')).toBeInTheDocument();
    });
  });

  it('filters projects based on search', async () => {
    renderWithContext(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Test Project 1' } });

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Project 2')).toBeInTheDocument();
    });
  });


  it('calculates and displays project progress correctly', async () => {
    const projectWithProgress = [{
      ...mockProjects[0],
      goals: [
        { text: 'Goal 1', completed: true },
        { text: 'Goal 2', completed: false }
      ]
    }];
    
    projectDB.fetchProjects.mockResolvedValueOnce(projectWithProgress);
    renderWithContext(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  it('displays appropriate message when no search results found', async () => {
    renderWithContext(<MyProjects />);

    // Wait for initial projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Find and trigger search through MainNav component
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Non-existent Project' } });
    
    // Submit the search form
    const searchForm = searchInput.closest('form');
    fireEvent.submit(searchForm);

    // Now we should see the no results message in an h3 element with the specific text
    await waitFor(() => {
      const noResultsMessage = screen.getByRole('heading', { 
        level: 3
      });
      expect(noResultsMessage).toHaveTextContent('No matching projects found');
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });
  });
});