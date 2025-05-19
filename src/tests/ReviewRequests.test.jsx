import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ReviewRequests from '../pages/reviewer/ReviewRequests';
import { auth } from '../backend/firebase/firebaseConfig';
import { notify } from '../backend/firebase/notificationsUtil';
import { getReviewerRequests, updateReviewRequestStatus } from '../backend/firebase/reviewerDB';
import { fetchProject } from '../backend/firebase/projectDB';

// Save original console methods
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        const skipMessages = [
            'An update to ReviewRequests inside a test was not wrapped in act',
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
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// Mock navigation components
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({
  default: () => <nav>Mock ReviewerMainNav</nav>
}));

vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({
  default: () => <nav>Mock ReviewerMobileBottomNav</nav>
}));

// Mock the modules
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-reviewer-id' }
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn()
  }
}));

// Mock the Firebase functions
vi.mock('../backend/firebase/reviewerDB', () => ({
  getReviewerRequests: vi.fn(),
  updateReviewRequestStatus: vi.fn()
}));

vi.mock('../backend/firebase/projectDB', () => ({
  fetchProject: vi.fn()
}));

vi.mock('../backend/firebase/notificationsUtil', () => ({
  notify: vi.fn()
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ReviewRequests Component', () => {
  const mockRequest = {
    id: 'request-1',
    projectId: 'project-1',
    status: 'pending',
    requestedAt: new Date('2025-05-03T20:20:24Z'),
    researcherName: 'Test Researcher',
    projectTitle: 'Test Project',
    project: {
      id: 'project-1',
      title: 'Test Project',
      description: 'Test Description',
      researchField: 'Computer Science',
      deadline: new Date('2025-05-20T20:20:24Z')
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(getReviewerRequests).mockResolvedValue([mockRequest]);
    vi.mocked(fetchProject).mockResolvedValue(mockRequest.project);
    vi.mocked(notify).mockImplementation(() => Promise.resolve());
  });

  it('renders loading state initially', () => {
    renderWithRouter(<ReviewRequests />);
    // Loading spinner should have an accessible role
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders review requests after loading', async () => {
    renderWithRouter(<ReviewRequests />);
    
    await waitFor(() => {
      expect(screen.getByText(mockRequest.project.title)).toBeInTheDocument();
      expect(screen.getByText(mockRequest.researcherName)).toBeInTheDocument();
      expect(screen.getByText(mockRequest.project.researchField)).toBeInTheDocument();
      expect(screen.getByText(/test description/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no requests are available', async () => {
    getReviewerRequests.mockResolvedValueOnce([]);
    
    renderWithRouter(<ReviewRequests />);
    
    await waitFor(() => {
      expect(screen.getByText(/no pending review requests/i)).toBeInTheDocument();
    });
  });

  it('handles accept request action', async () => {
    renderWithRouter(<ReviewRequests />);

    await waitFor(() => {
      expect(screen.getByText(mockRequest.project.title)).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(updateReviewRequestStatus).toHaveBeenCalledWith(mockRequest.id, 'accepted');
      expect(mockNavigate).toHaveBeenCalledWith(`/reviewer/review/${mockRequest.projectId}`);
    });
  });

  it('handles reject request action', async () => {
    renderWithRouter(<ReviewRequests />);

    await waitFor(() => {
      expect(screen.getByText(mockRequest.project.title)).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /decline/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(updateReviewRequestStatus).toHaveBeenCalledWith(mockRequest.id, 'rejected');
      expect(screen.getByText('Review request rejected')).toBeInTheDocument();
    });
  });

  it('handles error during request loading', async () => {
    const errorMessage = 'Failed to load requests';
    getReviewerRequests.mockRejectedValueOnce(new Error(errorMessage));

    renderWithRouter(<ReviewRequests />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });
  });

  it('handles error during accept action', async () => {
    const errorMessage = 'Failed to accept request';
    updateReviewRequestStatus.mockRejectedValueOnce(new Error(errorMessage));

    renderWithRouter(<ReviewRequests />);

    await waitFor(() => {
      expect(screen.getByText(mockRequest.project.title)).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });
  });

  it('redirects to login if user is not authenticated', async () => {
    vi.spyOn(auth, 'currentUser', 'get').mockReturnValueOnce(null);
    
    renderWithRouter(<ReviewRequests />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });



  it('handles mobile menu state', async () => {
    renderWithRouter(<ReviewRequests />);

    await waitFor(() => {
      expect(screen.getByText(/mock reviewermainnav/i)).toBeInTheDocument();
      expect(screen.getByText(/mock reviewermobilebottomnav/i)).toBeInTheDocument();
    });
  });

  

 
});