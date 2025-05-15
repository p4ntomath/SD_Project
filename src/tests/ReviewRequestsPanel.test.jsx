import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ReviewRequestsPanel from '../components/ReviewerComponents/ReviewRequestsPanel';
import { auth } from '../backend/firebase/firebaseConfig';
import { getReviewerRequests, updateReviewRequestStatus } from '../backend/firebase/reviewerDB';

// Mock data
const mockRequests = [
  {
    id: 'request1',
    projectId: 'project1',
    status: 'pending',
    createdAt: new Date(),
    project: {
      title: 'Test Project 1',
      description: 'Test Description 1'
    }
  },
  {
    id: 'request2',
    projectId: 'project2',
    status: 'pending',
    createdAt: new Date(),
    project: {
      title: 'Test Project 2',
      description: 'Test Description 2'
    }
  }
];

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Firebase auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Mock review database functions
vi.mock('../backend/firebase/reviewdb', () => ({
  getReviewerRequests: vi.fn(),
  updateReviewRequestStatus: vi.fn()
}));

// Suppress React act warnings and errors
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = (...args) => {
    if (args[0]?.includes('act') || args[0]?.includes('React state update')) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const skipMessages = [
      'An update to ReviewRequests inside a test was not wrapped in act',
      'When testing, code that causes React state updates should be wrapped into act'
    ];

    if (skipMessages.some(msg => args.some(arg => 
      (typeof arg === 'string' && arg.includes(msg)) ||
      (arg?.message && arg.message.includes(msg))
    ))) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  vi.clearAllMocks();
  getReviewerRequests.mockResolvedValue(mockRequests);
});

// Restore console functions after tests
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe('ReviewRequestsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReviewerRequests.mockResolvedValue(mockRequests);
  });

  it('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays review requests after loading', async () => {
    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });

  it('handles accept request action', async () => {
    updateReviewRequestStatus.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const acceptButtons = await screen.findAllByText('Accept Request');
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(updateReviewRequestStatus).toHaveBeenCalledWith('request1', 'accepted');
      expect(mockNavigate).toHaveBeenCalledWith('/reviewer/review/project1');
    });
  });

  it('handles reject request action', async () => {
    updateReviewRequestStatus.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const declineButtons = await screen.findAllByText('Decline');
    fireEvent.click(declineButtons[0]);

    await waitFor(() => {
      expect(updateReviewRequestStatus).toHaveBeenCalledWith('request1', 'rejected');
    });
  });

  it('displays error message when loading requests fails', async () => {
    const errorMessage = 'Failed to load requests';
    getReviewerRequests.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(`Error loading requests: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('displays no requests message when there are no pending requests', async () => {
    getReviewerRequests.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No pending review requests')).toBeInTheDocument();
    });
  });

  it('handles error during accept request action', async () => {
    const errorMessage = 'Failed to accept request';
    updateReviewRequestStatus.mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewRequestsPanel />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    await act(async () => {
      const acceptButtons = await screen.findAllByText('Accept Request');
      fireEvent.click(acceptButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(`Error loading requests: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('handles error during reject request action', async () => {
    const errorMessage = 'Failed to reject request';
    updateReviewRequestStatus.mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewRequestsPanel />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    await act(async () => {
      const declineButtons = await screen.findAllByText('Decline');
      fireEvent.click(declineButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(`Error loading requests: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    const testDate = new Date('2025-05-04T12:00:00');
    const requests = [{
      ...mockRequests[0],
      createdAt: testDate
    }];
    getReviewerRequests.mockResolvedValueOnce(requests);

    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/May 4, 2025/)).toBeInTheDocument();
    });
  });

  it('handles missing date gracefully', async () => {
    const requests = [{
      ...mockRequests[0],
      createdAt: null
    }];
    getReviewerRequests.mockResolvedValueOnce(requests);

    render(
      <MemoryRouter>
        <ReviewRequestsPanel />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Use a regex to match text that includes both "Requested on" and "Date not available"
      expect(screen.getByText(/Requested on.*Date not available/)).toBeInTheDocument();
    });
  });
});