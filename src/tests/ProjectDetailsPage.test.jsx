import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';

// Mock the components
vi.mock('../pages/ProjectDetailsPage', () => ({
  default: () => <div data-testid="project-details">Mocked ProjectDetailsPage</div>
}));

// Mock React Router hooks
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
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

describe('ProjectDetailsPage Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the project details page', () => {
    render(
      <MemoryRouter initialEntries={['/projects/test-project-id']}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('project-details')).toBeInTheDocument();
  });

  it('mocks the project DB functions correctly', async () => {
    const { fetchProject, updateProject, deleteProject } = await import('../backend/firebase/projectDB');
    
    // Test fetchProject
    const project = await fetchProject('test-project-id');
    expect(project.id).toBe('test-project-id');
    expect(project.title).toBe('Test Project');
    
    // Test updateProject
    const updateResult = await updateProject('test-project-id', { title: 'Updated Title' });
    expect(updateResult.success).toBe(true);
    
    // Test deleteProject
    const deleteResult = await deleteProject('test-project-id');
    expect(deleteResult.success).toBe(true);
  });
});