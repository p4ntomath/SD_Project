import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReviewRequestsSection from '../components/ReviewerComponents/ReviewRequestsSection';
import { fetchReviewRequests, respondToInvitation } from '../backend/firebase/reviewerDB';

// Mock the Firebase functions
vi.mock('../backend/firebase/reviewerDB', () => ({
  fetchReviewRequests: vi.fn(),
  respondToInvitation: vi.fn()
}));

// Mock Firebase Auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-reviewer-id' }
  }
}));

describe('ReviewRequestsSection', () => {
  const mockRequests = [
    {
      invitationId: 'inv1',
      project: {
        title: 'Test Project 1',
        description: 'Test Description 1'
      },
      createdAt: new Date('2025-05-01')
    },
    {
      invitationId: 'inv2',
      project: {
        title: 'Test Project 2',
        description: 'Test Description 2'
      },
      createdAt: new Date('2025-05-02')
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    fetchReviewRequests.mockImplementationOnce(() => new Promise(() => {}));
    render(<ReviewRequestsSection />);
    
    expect(screen.getByLabelText("loading-effect")).toBeInTheDocument();
  });

  it('displays review requests when loaded', async () => {
    fetchReviewRequests.mockResolvedValueOnce(mockRequests);

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    });
  });

  it('shows no requests message when there are no requests', async () => {
    fetchReviewRequests.mockResolvedValueOnce([]);

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText('No review requests')).toBeInTheDocument();
      expect(screen.getByText("You don't have any pending review requests at the moment.")).toBeInTheDocument();
    });
  });

  it('handles accept review task button click', async () => {
    fetchReviewRequests.mockResolvedValueOnce([mockRequests[0]]);
    respondToInvitation.mockResolvedValueOnce();

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText('Accept Review Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept Review Task'));

    await waitFor(() => {
      expect(respondToInvitation).toHaveBeenCalledWith('inv1', true);
    });
  });

  it('handles decline review task button click', async () => {
    fetchReviewRequests.mockResolvedValueOnce([mockRequests[0]]);
    respondToInvitation.mockResolvedValueOnce();

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText('Decline Review Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Decline Review Task'));

    await waitFor(() => {
      expect(respondToInvitation).toHaveBeenCalledWith('inv1', false);
    });
  });

  it('shows error message when loading fails', async () => {
    const errorMessage = 'Failed to load review requests';
    fetchReviewRequests.mockRejectedValueOnce(new Error(errorMessage));

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText(`Error loading review requests: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    fetchReviewRequests.mockResolvedValueOnce([mockRequests[0]]);

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText(/5\/1\/2025/)).toBeInTheDocument();
    });
  });

  it('disables buttons while responding', async () => {
    fetchReviewRequests.mockResolvedValueOnce([mockRequests[0]]);
    // Create a promise that we don't resolve immediately
    let resolveResponse;
    const responsePromise = new Promise(resolve => {
      resolveResponse = resolve;
    });
    respondToInvitation.mockImplementationOnce(() => responsePromise);

    render(<ReviewRequestsSection />);

    await waitFor(() => {
      expect(screen.getByText('Accept Review Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept Review Task'));

    await waitFor(() => {
        const declineButton = screen.getByRole('button', { name: /decline review task/i });
        const acceptButton = screen.getByRole('button', { name: /accept review task/i });
        expect(declineButton).toBeDisabled();
        expect(acceptButton).toBeDisabled();

    });
  });
});