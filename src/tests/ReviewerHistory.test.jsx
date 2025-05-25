// Mock firebaseConfig for authenticated user by default
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1' } }
}));
// Mock reviewerDB to allow resolved/rejected values to be customized
vi.mock('../backend/firebase/reviewerDB', () => ({
  getReviewerHistory: vi.fn()
}));
// Mock spinner and navigation components
vi.mock('react-spinners', () => ({ ClipLoader: () => <div data-testid="loader" /> }));
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({ __esModule: true, default: () => <nav data-testid="main-nav" /> }));
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({ __esModule: true, default: () => <footer data-testid="mobile-nav" /> }));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReviewerHistory from '../pages/ReviewerPages/ReviewerHistory.jsx';
import { getReviewerHistory } from '../backend/firebase/reviewerDB';
import { auth } from '../backend/firebase/firebaseConfig';

// Helper to render with router at /reviewer/history
const renderWithRouter = (entries) => render(
  <MemoryRouter initialEntries={entries}>
    <Routes>
      <Route path="/reviewer/history" element={<ReviewerHistory />} />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>
  </MemoryRouter>
);

describe('ReviewerHistory Page', () => {
  beforeEach(() => {
    // Ensure user is authenticated by default
    auth.currentUser = { uid: 'user1' };
  });

  it('redirects to login when unauthenticated', async () => {
    // Unset currentUser
    auth.currentUser = null;
    renderWithRouter(['/reviewer/history']);
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    getReviewerHistory.mockRejectedValue(new Error('Fetch failed'));
    renderWithRouter(['/reviewer/history']);
    await waitFor(() => {
      expect(screen.getByText('Fetch failed')).toBeInTheDocument();
    });
  });

  it('renders no history message when empty', async () => {
    getReviewerHistory.mockResolvedValue([]);
    renderWithRouter(['/reviewer/history']);
    await waitFor(() => {
      expect(screen.getByText('No review history')).toBeInTheDocument();
      expect(screen.getByText("You haven't completed any reviews yet.")).toBeInTheDocument();
    });
  });

  it('renders list of reviews', async () => {
    const mockReviews = [{
      id: 'r1',
      projectTitle: 'Proj1',
      researcherName: 'Alice',
      updatedAt: { seconds: 1672531200 }, // Jan 1 2023
      status: 'approved',
      rating: 4,
      feedback: 'Good work'
    }];
    getReviewerHistory.mockResolvedValue(mockReviews);
    const { container } = renderWithRouter(['/reviewer/history']);
    await waitFor(() => expect(screen.getByText('Proj1')).toBeInTheDocument());
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2023')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    // Check stars count by counting SVG elements
    const stars = container.querySelectorAll('svg');
    // 5 stars plus maybe navigation icons => at least 5
    expect(stars.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('Good work')).toBeInTheDocument();
  });

  it('displays message from location state', async () => {
    getReviewerHistory.mockResolvedValue([]);
    renderWithRouter([{ pathname: '/reviewer/history', state: { message: 'Success' } }]);
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
