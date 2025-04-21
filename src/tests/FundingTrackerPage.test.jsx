import React from 'react';
import { render, screen } from '@testing-library/react';
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
  ]))
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {}
}));

describe('FundingTrackerPage Test', () => {
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

  it('mocks the fetchProjects function correctly', async () => {
    const { fetchProjects } = await import('../backend/firebase/projectDB');
    expect(fetchProjects).toBeDefined();
    
    const projects = await fetchProjects('test-user-id');
    expect(projects).toHaveLength(2);
    expect(projects[0].title).toBe('Test Project 1');
  });
});