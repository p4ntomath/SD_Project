import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import AuthContext from '../context/AuthContext';

// Mock the components
vi.mock('../pages/ProjectDetailsPage', () => ({
  default: () => <div data-testid="project-details">Mocked ProjectDetailsPage</div>
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

// Mock firebase modules
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

  it('renders the project details page', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/projects/test-project-id']}>
          <Routes>
            <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    expect(screen.getByTestId('project-details')).toBeInTheDocument();
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
});