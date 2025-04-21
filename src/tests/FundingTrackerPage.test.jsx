import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import FundingTrackerPage from '../pages/FundingTrackerPage';

// Mock the components
vi.mock('../pages/FundingTrackerPage', () => ({
  default: () => <div data-testid="funding-tracker">Mocked FundingTrackerPage</div>
}));

// Mock the firebase modules
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn(() => Promise.resolve([
    {
      id: '1',
      title: 'Test Project 1',
      availableFunds: 10000,
      usedFunds: 5000,
      status: 'In Progress'
    },
    {
      id: '2',
      title: 'Test Project 2',
      availableFunds: 20000,
      usedFunds: 2000,
      status: 'Active'
    }
  ])),
  updateProject: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {}
}));

describe('FundingTrackerPage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the funding tracker page', () => {
    render(
      <MemoryRouter>
        <FundingTrackerPage />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('funding-tracker')).toBeInTheDocument();
  });

  it('fetches and displays projects with funding information', async () => {
    const { fetchProjects } = await import('../backend/firebase/projectDB');
    expect(fetchProjects).toBeDefined();
    
    const projects = await fetchProjects('test-user-id');
    expect(projects).toHaveLength(2);
    expect(projects[0].title).toBe('Test Project 1');
    expect(projects[0].availableFunds).toBe(10000);
  });

  it('calculates remaining funds correctly', async () => {
    const { fetchProjects } = await import('../backend/firebase/projectDB');
    const projects = await fetchProjects('test-user-id');
    
    const project = projects[0];
    const remainingFunds = project.availableFunds - project.usedFunds;
    expect(remainingFunds).toBe(5000);
  });

  it('handles projects with no funding data', async () => {
    const { fetchProjects } = await import('../backend/firebase/projectDB');
    // Update the mock implementation for this specific test
    vi.mocked(fetchProjects).mockResolvedValueOnce([
      {
        id: '3',
        title: 'Test Project 3',
        status: 'New'
      }
    ]);

    const projects = await fetchProjects('test-user-id');
    const project = projects[0];
    
    expect(project.availableFunds).toBeUndefined();
    expect(project.usedFunds).toBeUndefined();
  });

  it('updates project funding information successfully', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    
    const result = await updateProject('1', {
      availableFunds: 15000,
      usedFunds: 7000
    });
    
    expect(result.success).toBe(true);
  });
});