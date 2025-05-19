import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReviewersCard from '../components/ProjectDetailsPage/ReviewersCard';
import { auth } from '../backend/firebase/firebaseConfig';
import { createReviewRequest, getReviewerRequestsForProject } from '../backend/firebase/reviewerDB';
import { isProjectOwner, checkPermission } from '../utils/permissions';

// Mock the permissions module
vi.mock('../utils/permissions', () => ({
  isProjectOwner: vi.fn(),
  checkPermission: vi.fn()
}));

// Mock Firebase auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User'
    }
  }
}));

// Mock reviewerDB functions
vi.mock('../backend/firebase/reviewerDB', () => ({
  createReviewRequest: vi.fn(),
  getReviewerRequestsForProject: vi.fn()
}));

describe('ReviewersCard', () => {
  const mockProject = {
    id: 'test-project',
    title: 'Test Project',
    userId: 'test-user-id',
    reviewers: [
      {
        id: 'reviewer1',
        name: 'John Reviewer',
        reviewStatus: 'pending'
      }
    ]
  };

  const mockReviewRequests = [
    {
      id: 'request1',
      reviewerId: 'reviewer1',
      status: 'pending',
      reviewerName: 'John Reviewer',
      requestedAt: new Date()
    }
  ];

  const defaultProps = {
    project: mockProject,
    reviewRequests: mockReviewRequests,
    formatDate: (date) => date.toISOString(),
    setReviewRequests: vi.fn(),
    projectId: 'test-project',
    setModalOpen: vi.fn(),
    setStatusMessage: vi.fn(),
    setError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default permission checks
    vi.mocked(isProjectOwner).mockReturnValue(true);
    vi.mocked(checkPermission).mockReturnValue(false);
  });

  it('renders without crashing', () => {
    render(<ReviewersCard {...defaultProps} />);
    expect(screen.getByText('Project Reviewers')).toBeInTheDocument();
  });

  it('displays active reviewers and pending requests', () => {
    render(<ReviewersCard {...defaultProps} />);
    
    // Check active reviewers section
    const activeReviewersSection = screen.getByText('Active Reviewers').parentElement;
    expect(activeReviewersSection.querySelector('p.font-medium')).toHaveTextContent('John Reviewer');

    // Check review requests section
    const reviewRequestsSection = screen.getByText('Review Requests').parentElement;
    expect(reviewRequestsSection.querySelector('p.font-medium')).toHaveTextContent('John Reviewer');
  });

  it('shows assign reviewers button for project owners', () => {
    vi.mocked(isProjectOwner).mockReturnValue(true);
    render(<ReviewersCard {...defaultProps} />);
    expect(screen.getByText('Assign Reviewers')).toBeInTheDocument();
  });

  it('hides assign reviewers button for non-owners without permission', () => {
    vi.mocked(isProjectOwner).mockReturnValue(false);
    vi.mocked(checkPermission).mockReturnValue(false);
    render(<ReviewersCard {...defaultProps} />);
    expect(screen.queryByText('Assign Reviewers')).not.toBeInTheDocument();
  });
});