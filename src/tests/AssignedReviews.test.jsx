import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AssignedReviews from '../pages/reviewer/AssignedReviews.jsx';
import { getReviewerRequests } from '../backend/firebase/reviewerDB';
import { fetchProject } from '../backend/firebase/projectDB';
import { auth } from '../backend/firebase/firebaseConfig';

// Mocks
vi.mock('../backend/firebase/reviewerDB', () => ({
  getReviewerRequests: vi.fn(),
}));
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProject: vi.fn(),
}));
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1' } }
}));
vi.mock('react-spinners', () => ({
  ClipLoader: ({ role, 'aria-label': label }) => <div role={role} aria-label={label} />
}));
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({
  __esModule: true,
  default: () => <nav data-testid="main-nav" />
}));
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({
  __esModule: true,
  default: () => <footer data-testid="mobile-nav" />
}));

const renderWithRouter = (entries) => render(
  <MemoryRouter initialEntries={entries}>
    <Routes>
      <Route path="/reviewer/assigned" element={<AssignedReviews />} />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>
  </MemoryRouter>
);

describe('AssignedReviews Page', () => {
  beforeEach(() => {
    // Default authenticated user
    auth.currentUser = { uid: 'user1' };  
  });

  it('redirects to login when unauthenticated', async () => {
    auth.currentUser = null;
    renderWithRouter(['/reviewer/assigned']);
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('shows loader initially', () => {
    // Promise that never resolves to keep loading
    getReviewerRequests.mockReturnValue(new Promise(() => {}));
    renderWithRouter(['/reviewer/assigned']);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('displays error when fetch fails', async () => {
    getReviewerRequests.mockRejectedValue(new Error('Fetch error'));
    renderWithRouter(['/reviewer/assigned']);
    await waitFor(() => {
      expect(screen.getByText('Fetch error')).toBeInTheDocument();
    });
  });

  it('shows no assigned reviews when none', async () => {
    getReviewerRequests.mockResolvedValue([]);
    renderWithRouter(['/reviewer/assigned']);
    await waitFor(() => {
      expect(screen.getByText('No assigned reviews')).toBeInTheDocument();
      expect(screen.getByText("You don't have any reviews to complete at the moment.")).toBeInTheDocument();
    });
  });

  it('renders list of assigned reviews', async () => {
    // only accepted and active pending
    const requests = [
      { id: 'r1', projectId: 'p1', status: 'accepted', isActiveReviewer: false, researcherName: 'Bob', requestedAt: { seconds: 1685000000 } },
      { id: 'r2', projectId: 'p2', status: 'pending', isActiveReviewer: true, researcherName: 'Carol', requestedAt: new Date('2025-05-01') }
    ];
    const proj1 = { id: 'p1', title: 'Project One', researchField: 'Math', deadline: { seconds: 1686000000 }, description: 'Desc1' };
    const proj2 = { id: 'p2', title: 'Project Two', researchField: 'Sci', deadline: null, description: '' };
    getReviewerRequests.mockResolvedValue(requests);
    fetchProject.mockImplementation((pid) => pid === 'p1' ? Promise.resolve(proj1) : Promise.resolve(proj2));

    renderWithRouter(['/reviewer/assigned']);
    await waitFor(() => screen.getByText('Project One'));

    // Check first project
    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    // formatted requestedAt dates
    expect(screen.getByText('May 25, 2023')).toBeInTheDocument();
    expect(screen.getByText('May 1, 2025')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Check second project
    expect(screen.getByText('Project Two')).toBeInTheDocument();
    expect(screen.getByText('Sci')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });
});