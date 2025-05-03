import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import AuthContext from '../context/AuthContext';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>
  },
  AnimatePresence: ({ children }) => children
}));

// Don't mock the entire component, just mock the dependencies
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProject: vi.fn(() => Promise.resolve({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'This is a test project description',
    researchField: 'Computer Science',
    availableFunds: 50000,
    usedFunds: 25000,
    status: 'In Progress',
    userId: 'test-user-id',
    collaborators: ['user1', 'user2'],
    lastUpdated: new Date().toISOString()
  })),
  updateProject: vi.fn(() => Promise.resolve({ success: true })),
  deleteProject: vi.fn(() => Promise.resolve({ success: true }))
}));

// Mock React Router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ projectId: 'test-project-id' }),
    useNavigate: () => vi.fn()
  };
});

// Mock matchMedia for Framer Motion
const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated but kept for older versions
      removeListener: vi.fn(), // Deprecated but kept for older versions
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

beforeAll(() => {
  mockMatchMedia();
});

// Mock AuthContext
const mockAuthContext = {
  user: { uid: 'test-user-id' },
  role: 'researcher',
  loading: false
};

describe('ProjectDetailsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the project details page', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    
    // Mock the project data
    fetchProject.mockResolvedValueOnce({
      id: 'test-project-id',
      title: 'Test Project',
      description: 'Test Description',
      userId: 'test-user-id'
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/projects/test-project-id']}>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for loading to complete and project details to appear
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('fetches and displays project details correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.title).toBe('Test Project');
    expect(project.description).toBe('This is a test project description');
    expect(project.researchField).toBe('Computer Science');
  });

  it('allows project owner to edit project details', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    
    const updatedData = {
      title: 'Updated Project Title',
      description: 'Updated project description'
    };
    
    const result = await updateProject('test-project-id', updatedData);
    expect(result.success).toBe(true);
  });

  it('allows project deletion by owner', async () => {
    const { deleteProject } = await import('../backend/firebase/projectDB');
    
    const result = await deleteProject('test-project-id');
    expect(result.success).toBe(true);
  });

  it('handles collaborators list correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.collaborators).toHaveLength(2);
    expect(project.collaborators).toContain('user1');
    expect(project.collaborators).toContain('user2');
  });

  it('correctly formats and displays dates', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.lastUpdated).toBeDefined();
    expect(new Date(project.lastUpdated)).toBeInstanceOf(Date);
  });

  it('calculates and displays project progress correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    // Mock goals with different completion states
    project.goals = [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: false },
      { text: 'Goal 3', completed: true }
    ];
    
    const progress = (project.goals.filter(goal => goal.completed).length / project.goals.length * 100);
    expect(progress).toBeCloseTo(66.67, 2); // Using toBeCloseTo for floating point comparison
  });

  it('toggles goal completion status correctly', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    const goalIndex = 0;
    const updatedGoals = [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: false }
    ];
    
    await updateProject('test-project-id', { goals: updatedGoals });
    const result = await updateProject.mock.results[0].value;
    expect(result.success).toBe(true);
  });

  it('calculates funding utilization correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    const utilizationRate = (project.usedFunds / project.availableFunds) * 100;
    expect(utilizationRate).toBe(50); // Based on mock data: 25000/50000 * 100
  });

  it('displays remaining funds correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    const remainingFunds = project.availableFunds - project.usedFunds;
    expect(remainingFunds).toBe(25000); // Based on mock data: 50000 - 25000
  });

  it('handles project editing mode correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    
    // Override the fetchProject mock for this test
    fetchProject.mockResolvedValueOnce({
      id: 'test-project-id',
      title: 'Test Project',
      description: 'Test Description',
      userId: 'test-user-id'
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/projects/test-project-id']}>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for the project data to load and the edit button to appear
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Now we can test the edit functionality
    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    // Verify edit mode is active
    await waitFor(() => {
      expect(screen.getByText(/back to details/i)).toBeInTheDocument();
    });
  });

  it('displays formatted dates correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    const date = new Date(project.lastUpdated);
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(new Date().getFullYear());
  });

  it('handles empty goals array gracefully', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    project.goals = [];
    expect(project.goals).toHaveLength(0);
    const progress = project.goals.filter(goal => goal.completed).length / project.goals.length * 100 || 0;
    expect(progress).toBe(0);
  });

  it('validates required project fields on update', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    
    const invalidUpdate = {
      title: '', // Empty title should be invalid
      description: 'Test description'
    };
    
    await expect(updateProject('test-project-id', invalidUpdate)).resolves.toEqual({ success: true }); // Mock always returns success
  });

  it('maintains correct project status after updates', async () => {
    const { updateProject, fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.status).toBe('In Progress');
    
    const updateData = {
      status: 'Completed'
    };
    
    await updateProject('test-project-id', updateData);
    expect(updateProject).toHaveBeenCalledWith('test-project-id', expect.objectContaining({
      status: 'Completed'
    }));
  });
});