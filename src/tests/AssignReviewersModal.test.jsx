import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';
import AssignReviewersModal from '../components/ResearcherComponents/AssignReviewersModal';
import { getAvailableReviewers } from '../backend/firebase/reviewerDB';

// Suppress console errors and warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const skipMessages = [
      'An update to AssignReviewersModal inside a test was not wrapped in act',
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
      'An update to AssignReviewersModal inside a test was not wrapped in act',
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

// Mock framer-motion to avoid animation-related issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock the Firebase reviewer database functions
vi.mock('../backend/firebase/reviewerDB', () => ({
  getAvailableReviewers: vi.fn(),
}));

const mockReviewers = [
  {
    id: '1',
    fullName: 'John Doe',
    fieldOfResearch: 'Computer Science',
    department: 'Engineering'
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    fieldOfResearch: 'Data Science',
    department: 'Science'
  }
];

const mockReviewRequests = [
  {
    reviewerId: '3',
    status: 'pending'
  },
  {
    reviewerId: '4',
    status: 'accepted'
  }
];

describe('AssignReviewersModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAssign = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onAssign: mockOnAssign,
    projectId: 'project-123',
    reviewRequests: mockReviewRequests
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAvailableReviewers).mockResolvedValue(mockReviewers);
  });

  it('renders nothing when isOpen is false', () => {
    render(<AssignReviewersModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Assign Reviewers')).not.toBeInTheDocument();
  });

  it('renders the modal with correct title when open', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    expect(screen.getByText('Assign Reviewers')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching reviewers', () => {
    render(<AssignReviewersModal {...defaultProps} />);
    expect(screen.getByText('Loading reviewers...')).toBeInTheDocument();
  });

  it('displays reviewers after loading', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Computer Science • Engineering')).toBeInTheDocument();
      expect(screen.getByText('Data Science • Science')).toBeInTheDocument();
    });
  });

  it('filters reviewers based on search query', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search reviewers/i);
    fireEvent.change(searchInput, { target: { value: 'data science' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Data Science • Science')).toBeInTheDocument();
    });
  });

  it('allows selecting and deselecting reviewers', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const reviewerElement = screen.getByText('John Doe').closest('div[role="button"]') || screen.getByText('John Doe').parentElement?.parentElement?.parentElement;
    fireEvent.click(reviewerElement);
    expect(screen.getByText('1 reviewer selected')).toBeInTheDocument();

    fireEvent.click(reviewerElement);
    expect(screen.getByText('0 reviewers selected')).toBeInTheDocument();
  });

  it('calls onAssign with selected reviewers when confirming', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const reviewerElement = screen.getByText('John Doe').closest('div[role="button"]') || screen.getByText('John Doe').parentElement?.parentElement?.parentElement;
    fireEvent.click(reviewerElement);

    const confirmButton = screen.getByRole('button', { name: /confirm assignment/i });
    fireEvent.click(confirmButton);

    expect(mockOnAssign).toHaveBeenCalledWith([{
      id: '1',
      name: 'John Doe',
      fieldOfResearch: 'Computer Science',
      department: 'Engineering'
    }]);
  });

  it('calls onClose when clicking the cancel button', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking the close icon', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables the confirm button when no reviewers are selected', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm assignment/i });
    expect(confirmButton).toBeDisabled();
  });

  it('shows "No reviewers found" message when search returns no results', async () => {
    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search reviewers/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent reviewer' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.getByText('No reviewers found')).toBeInTheDocument();
    });
  });

  it('excludes reviewers with pending or accepted requests', async () => {
    const busyReviewer = {
      id: '3',
      fullName: 'Busy Reviewer',
      expertise: 'Physics',
      department: 'Science'
    };

    vi.mocked(getAvailableReviewers).mockResolvedValueOnce([...mockReviewers, busyReviewer]);

    render(<AssignReviewersModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Busy Reviewer')).not.toBeInTheDocument();
    });
  });
});