import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (args[0]?.includes('inside a test was not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

// Mock the reviewerDB module
vi.mock('../backend/firebase/reviewerDB.jsx', () => ({
  getProjectReviews: vi.fn()
}));

import ProjectReviews from '../components/ProjectDetailsPage/ProjectReviews';
import { getProjectReviews } from '../backend/firebase/reviewerDB.jsx';

describe('ProjectReviews', () => {
  const mockFormatDate = vi.fn((date) => 'May 25, 2025');
  const projectId = 'project123';

  const mockReviews = [
    {
      id: 'review1',
      reviewer: {
        fullName: 'Dr. Jane Smith',
        expertise: 'Machine Learning'
      },
      status: 'approved',
      rating: 5,
      feedback: 'Excellent research with strong methodology and clear results.',
      createdAt: { seconds: 1716681600 } // Mock timestamp
    },
    {
      id: 'review2',
      reviewer: {
        fullName: 'Prof. John Doe',
        expertise: 'Data Science'
      },
      status: 'needs_revision',
      rating: 3,
      feedback: 'Good work but needs improvements in the analysis section.\nPlease address the statistical concerns.',
      createdAt: { seconds: 1716595200 }
    },
    {
      id: 'review3',
      reviewer: {
        fullName: 'Dr. Alice Johnson',
        expertise: 'Computer Vision'
      },
      status: 'rejected',
      rating: 2,
      feedback: 'The methodology is flawed and results are inconclusive.',
      createdAt: { seconds: 1716508800 }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatDate.mockClear();
  });

  it('shows loading spinner initially', () => {
    getProjectReviews.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    expect(screen.getByRole('status', { name: 'Loading reviews' })).toBeInTheDocument();
  });

  it('displays error message when review loading fails', async () => {
    const errorMessage = 'Failed to load reviews';
    getProjectReviews.mockRejectedValue(new Error(errorMessage));

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      expect(screen.getByText(`Error loading reviews: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('shows no reviews message when no reviews exist', async () => {
    getProjectReviews.mockResolvedValue([]);

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      expect(screen.getByText('No reviews available yet')).toBeInTheDocument();
    });
  });

  it('displays all reviews with correct information', async () => {
    getProjectReviews.mockResolvedValue(mockReviews);

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      // Check reviewer names
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Prof. John Doe')).toBeInTheDocument();
      expect(screen.getByText('Dr. Alice Johnson')).toBeInTheDocument();
    });

    // Check expertise
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Data Science')).toBeInTheDocument();
    expect(screen.getByText('Computer Vision')).toBeInTheDocument();

    // Check feedback
    expect(screen.getByText('Excellent research with strong methodology and clear results.')).toBeInTheDocument();
    expect(screen.getByText(/Good work but needs improvements in the analysis section/)).toBeInTheDocument();
    expect(screen.getByText('The methodology is flawed and results are inconclusive.')).toBeInTheDocument();

    // Check that formatDate was called for each review
    expect(mockFormatDate).toHaveBeenCalledTimes(3);
  });

  it('displays correct status badges for different review statuses', async () => {
    getProjectReviews.mockResolvedValue(mockReviews);

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Needs Revision')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });



  it('handles anonymous reviewer gracefully', async () => {
    const anonymousReview = {
      id: 'review4',
      reviewer: null,
      status: 'in_progress',
      rating: 4,
      feedback: 'Review in progress.',
      createdAt: { seconds: 1716681600 }
    };

    getProjectReviews.mockResolvedValue([anonymousReview]);

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      expect(screen.getByText('Anonymous Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Expertise not specified')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('handles missing reviewer expertise', async () => {
    const reviewWithoutExpertise = {
      id: 'review5',
      reviewer: {
        fullName: 'Dr. Test Reviewer'
      },
      status: 'approved',
      rating: 4,
      feedback: 'Good work.',
      createdAt: { seconds: 1716681600 }
    };

    getProjectReviews.mockResolvedValue([reviewWithoutExpertise]);

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      expect(screen.getByText('Dr. Test Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Expertise not specified')).toBeInTheDocument();
    });
  });

  it('reloads reviews when projectId changes', async () => {
    const { rerender } = render(<ProjectReviews projectId="project1" formatDate={mockFormatDate} />);
    
    expect(getProjectReviews).toHaveBeenCalledWith('project1');

    rerender(<ProjectReviews projectId="project2" formatDate={mockFormatDate} />);
    
    expect(getProjectReviews).toHaveBeenCalledWith('project2');
    expect(getProjectReviews).toHaveBeenCalledTimes(2);
  });

  it('preserves whitespace and line breaks in feedback', async () => {
    const reviewWithLineBreaks = {
      id: 'review6',
      reviewer: {
        fullName: 'Dr. Multi Line',
        expertise: 'Testing'
      },
      status: 'approved',
      rating: 4,
      feedback: 'Line 1\nLine 2\n\nLine 4 after empty line',
      createdAt: { seconds: 1716681600 }
    };

    getProjectReviews.mockResolvedValue([reviewWithLineBreaks]);

    render(<ProjectReviews projectId={projectId} formatDate={mockFormatDate} />);

    await waitFor(() => {
      const feedbackElement = screen.getByText(/Line 1/);
      expect(feedbackElement).toHaveClass('whitespace-pre-wrap');
    });
  });
});