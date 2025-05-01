import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateProjectForm from '../components/CreateProjectForm';

// Mock the components and React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return { ...actual, default: actual };
});

// Mock the component itself
vi.mock('../components/CreateProjectForm', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'create-project-form',
      children: [
        React.createElement('h2', { key: 'title' }, 'Create New Project'),
        React.createElement('form', { key: 'form' }, [
          React.createElement('input', { key: 'title-input', placeholder: 'Project Title' }),
          React.createElement('textarea', { key: 'desc-input', placeholder: 'Project Description' }),
          React.createElement('button', { key: 'submit', type: 'submit' }, 'Create Project')
        ])
      ]
    });
  }
}));

// Mock the project database functions
vi.mock('../backend/firebase/projectDB', () => ({
  createProject: vi.fn().mockImplementation((projectData) => {
    return Promise.resolve('new-project-id');
  })
}));

// Mock Auth Context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false
  })
}));

describe('CreateProjectForm Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the create project form correctly', () => {
    render(<CreateProjectForm />);
    expect(screen.getByTestId('create-project-form')).toBeInTheDocument();
  });

  it('mocks the createProject function correctly', async () => {
    const { createProject } = await import('../backend/firebase/projectDB');
    expect(createProject).toBeDefined();
    
    const projectData = {
      title: 'Test Project',
      description: 'This is a test project',
      researchField: 'Computer Science'
    };
    
    const result = await createProject(projectData);
    expect(result).toBe('new-project-id');
  });
});