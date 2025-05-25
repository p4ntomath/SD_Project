import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ReviewerProjects from '../pages/reviewer/ReviewerProjects.jsx';
import { getReviewerRequests } from '../backend/firebase/reviewerDB';
import { fetchProject } from '../backend/firebase/projectDB';

// Mock firebase configuration and auth
vi.mock('../backend/firebase/firebaseConfig', () => ({ auth: { currentUser: { uid: 'user1' } } }));
// Mock reviewerDB and projectDB
vi.mock('../backend/firebase/reviewerDB', () => ({ getReviewerRequests: vi.fn() }));
vi.mock('../backend/firebase/projectDB', () => ({ fetchProject: vi.fn() }));
// Mock spinner
vi.mock('react-spinners', () => ({ ClipLoader: () => <div data-testid="loader" /> }));
// Mock navigation components
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({ __esModule: true, default: () => <nav data-testid="main-nav" /> }));
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({ __esModule: true, default: () => <footer data-testid="mobile-nav" /> }));

describe('ReviewerProjects Page', () => {
  it('shows loader initially', () => {
    // Keep promise pending to stay in loading
    getReviewerRequests.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <ReviewerProjects />
      </MemoryRouter>
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders empty state when no approved projects', async () => {
    getReviewerRequests.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ReviewerProjects />
      </MemoryRouter>
    );
    expect(await screen.findByText('No approved projects')).toBeInTheDocument();
    expect(screen.getByText("Projects you accept for review will appear here.")).toBeInTheDocument();
  });

  it('renders list of approved projects', async () => {
    const now = { seconds: 1750000000 };
    const requests = [{ id: 'r1', projectId: 'p1', status: 'accepted', researcherName: 'Alice', requestedAt: now }];
    const projectData = { id: 'p1', title: 'Project A', researchField: 'Biology', deadline: { seconds: 1760000000 }, description: 'DescA' };
    getReviewerRequests.mockResolvedValue(requests);
    fetchProject.mockResolvedValue(projectData);

    render(
      <MemoryRouter>
        <ReviewerProjects />
      </MemoryRouter>
    );
    expect(await screen.findByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Biology')).toBeInTheDocument();
    // Check researcher name
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // Status header exists
    expect(screen.getByText('Approved Projects')).toBeInTheDocument();
  });
});