import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProjectFeedback from '../components/ResearcherComponents/ProjectFeedback';
import { getProjectFeedback } from '../backend/firebase/reviewerDB';

// Mock the Firebase reviewer database functions
vi.mock('../backend/firebase/reviewerDB', () => ({
  getProjectFeedback: vi.fn()
}));

const mockFeedback = [
  {
    id: '1',
    reviewer: {
      name: 'John Doe',
      expertise: 'Computer Science'
    },
    status: 'approved',
    rating: 4,
    feedback: 'Great project implementation',
    createdAt: '2025-05-01T10:00:00.000Z'
  },
  {
    id: '2',
    reviewer: {
      name: 'Jane Smith',
      expertise: 'Data Science'
    },
    status: 'needs_revision',
    rating: 3,
    feedback: 'Needs some improvements',
    createdAt: '2025-05-02T10:00:00.000Z'
  }
];

describe('ProjectFeedback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(getProjectFeedback).mockImplementation(() => new Promise(() => {}));
    render(<ProjectFeedback projectId="project-123" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays feedback items when loaded successfully', async () => {
    vi.mocked(getProjectFeedback).mockResolvedValue(mockFeedback);
    
    await act(async () => {
      render(<ProjectFeedback projectId="project-123" />);
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Data Science')).toBeInTheDocument();
    expect(screen.getByText('Great project implementation')).toBeInTheDocument();
    expect(screen.getByText('Needs some improvements')).toBeInTheDocument();
  });

  it('displays error message when loading fails', async () => {
    const errorMessage = 'Failed to load feedback';
    vi.mocked(getProjectFeedback).mockRejectedValue(new Error(errorMessage));
    
    await act(async () => {
      render(<ProjectFeedback projectId="project-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading feedback: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('displays "No feedback available yet" when feedback array is empty', async () => {
    vi.mocked(getProjectFeedback).mockResolvedValue([]);
    
    await act(async () => {
      render(<ProjectFeedback projectId="project-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No feedback available yet')).toBeInTheDocument();
    });
  });

  it('displays correct status badges with appropriate styling', async () => {
    vi.mocked(getProjectFeedback).mockResolvedValue(mockFeedback);
    
    await act(async () => {
      render(<ProjectFeedback projectId="project-123" />);
    });
    
    await waitFor(() => {
      const approvedStatus = screen.getByText('Project Approved');
      const revisionStatus = screen.getByText('Revisions Required');
      
      expect(approvedStatus).toHaveStyle({
        backgroundColor: 'rgb(220 252 231)',
        color: 'rgb(22 101 52)'
      });
      
      expect(revisionStatus).toHaveStyle({
        backgroundColor: 'rgb(254 249 195)',
        color: 'rgb(133 77 14)'
      });
    });
  });

  it('displays correct number of stars based on rating', async () => {
    vi.mocked(getProjectFeedback).mockResolvedValue([mockFeedback[0]]);
    
    await act(async () => {
      render(<ProjectFeedback projectId="project-123" />);
    });
    
    await waitFor(() => {
      const filledStars = screen.getAllByTestId('filled-star');
      const emptyStars = screen.getAllByTestId('empty-star');
      
      expect(filledStars).toHaveLength(4); // Rating is 4
      expect(emptyStars).toHaveLength(1); // 5 - 4 = 1 empty star
    });
  });

  it('formats dates correctly', async () => {
    vi.mocked(getProjectFeedback).mockResolvedValue([mockFeedback[0]]);
    
    await act(async () => {
      render(<ProjectFeedback projectId="project-123" />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('5/1/2025')).toBeInTheDocument();
    });
  });

  it('calls getProjectFeedback with correct projectId', async () => {
    const projectId = 'project-123';
    vi.mocked(getProjectFeedback).mockResolvedValue([]);
    
    await act(async () => {
      render(<ProjectFeedback projectId={projectId} />);
    });
    
    expect(getProjectFeedback).toHaveBeenCalledWith(projectId);
    expect(getProjectFeedback).toHaveBeenCalledTimes(1);
  });
});