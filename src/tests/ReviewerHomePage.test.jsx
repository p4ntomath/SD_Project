import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';
import ReviewerHomePage from '../pages/ReviewerHomePage';
import { auth } from '../backend/firebase/firebaseConfig';
import { getReviewerRequests, updateReviewRequestStatus } from '../backend/firebase/reviewerDB';

// Save original console methods
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const skipMessages = [
      'An update to ReviewerHomePage inside a test was not wrapped in act',
      'When testing, code that causes React state updates should be wrapped into act',
      'ensures that you\'re testing the behavior the user would see in the browser'
    ];

    if (skipMessages.some(msg => args.some(arg => 
      (typeof arg === 'string' && arg.includes(msg)) ||
      (arg?.message && arg.message.includes(msg))
    ))) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const skipMessages = [
      'An update to ReviewerHomePage inside a test was not wrapped in act',
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
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock firebase config
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-reviewer-id' }
  }
}));

// Mock reviewdb functions
vi.mock('../backend/firebase/reviewerDB', () => ({
  getReviewerRequests: vi.fn(() => Promise.resolve([])),
  updateReviewRequestStatus: vi.fn()
}));

// Mock notificationsUtil
vi.mock('../backend/firebase/notificationsUtil', () => ({
  useUnreadNotificationsCount: vi.fn(() => 0),
  useUnreadMessagesCount: vi.fn(() => 0),
  notify: vi.fn()
}));

// Mock window.matchMedia for Framer Motion
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('ReviewerHomePage', () => {
  const mockReviewRequests = [
    {
      id: 'request1',
      projectId: 'project1',
      status: 'pending',
      projectTitle: 'Test Project 1',
      requestedAt: new Date()
    },
    {
      id: 'request2',
      projectId: 'project2',
      status: 'accepted',
      projectTitle: 'Test Project 2',
      requestedAt: new Date()
    },
    {
      id: 'request3',
      projectId: 'project3',
      status: 'completed',
      projectTitle: 'Test Project 3',
      requestedAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getReviewerRequests.mockResolvedValue(mockReviewRequests);
  });

  it('renders loading state initially', async () => {
    
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
   

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays review statistics correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      // Check stats
        const pendingReviewsH1 = screen.getByTestId('pending-reviews-count');
        const requestReviewsH1 = screen.getByTestId('review-requests-count');
        const completedReviewsH1 = screen.getByTestId('completed-reviews-count');
        const totalReviewsH1 = screen.getByTestId('total-reviews-count');
        expect(pendingReviewsH1).toHaveTextContent('1');
        expect(requestReviewsH1).toHaveTextContent('1');
        expect(completedReviewsH1).toHaveTextContent('1');
        expect(totalReviewsH1).toHaveTextContent('3');
    });
  });

  it('navigates to review requests page when viewing pending reviews', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      const viewRequestsButton = screen.getAllByTestId('view-requests-button')[0]; // Assuming the first button is for pending reviews
      fireEvent.click(viewRequestsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/reviewer/requests', { state: { reviewRequests: mockReviewRequests } });
    });
  });

  it('navigates to review history page when clicking completed reviews', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      const viewHistoryButton = screen.getByText(/Review History/i);
      fireEvent.click(viewHistoryButton);
      expect(mockNavigate).toHaveBeenCalledWith('/reviewer/history');
    });
  });

  it('handles search functionality', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search people.../i);
      fireEvent.change(searchInput, { target: { value: 'Test Project 1' } });
    });

    // Verify search functionality works as expected
    // This will depend on how search is implemented in the component
  });

  it('handles error when loading review requests fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getReviewerRequests.mockRejectedValueOnce(new Error('Failed to load requests'));

    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error loading review requests:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('displays correct quick action buttons', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReviewerHomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
        const viewReqButton = screen.getByTestId('view-requests-button');
        expect(viewReqButton).toBeInTheDocument();
      expect(screen.getByText(/Review History/i)).toBeInTheDocument();
      expect(screen.getByText(/View Analytics/i)).toBeInTheDocument();
    });
  });
});