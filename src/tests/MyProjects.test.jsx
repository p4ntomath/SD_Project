import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
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

  const mockNavigate = vi.fn();

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
  });

  it('displays projects after loading', async () => {
    renderWithContext(<MyProjects />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });

  it('shows create project form when button is clicked', async () => {
    renderWithContext(<MyProjects />);
    
    const createButton = await screen.findByText('Create Project');
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
      expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
    });
  });
});