import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import GoalsCard from '@/components/ProjectDetailsPage/GoalsCard';
import * as permissions from '@/utils/permissions';
import { notify } from '@/backend/firebase/notificationsUtil';

// Mock permissions
vi.mock('@/utils/permissions', () => ({
  checkPermission: vi.fn(),
  isProjectOwner: vi.fn()
}));

// Mock notifications
vi.mock('@/backend/firebase/notificationsUtil', () => ({
  notify: vi.fn()
}));

describe('GoalsCard', () => {
  const mockProject = {
    goals: [
      { text: 'Goal 1', completed: false },
      { text: 'Goal 2', completed: true }
    ]
  };

  const mockProps = {
    project: mockProject,
    calculateProgress: vi.fn().mockReturnValue(50),
    setProject: vi.fn(),
    projectId: 'test-project-id',
    setModalOpen: vi.fn(),
    setError: vi.fn(),
    setStatusMessage: vi.fn(),
    updateProject: vi.fn().mockResolvedValue()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders goals correctly', () => {
    permissions.checkPermission.mockReturnValue(true);
    permissions.isProjectOwner.mockReturnValue(true);

    render(<GoalsCard {...mockProps} />);

    expect(screen.getByText('Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Goal 2')).toBeInTheDocument();
  });

  test('shows "No goals defined yet" when no goals exist', () => {
    const projectWithoutGoals = { ...mockProject, goals: [] };
    render(<GoalsCard {...mockProps} project={projectWithoutGoals} />);

    expect(screen.getByText('No goals defined yet.')).toBeInTheDocument();
  });

  test('handles goal completion toggle', async () => {
    permissions.checkPermission.mockReturnValue(true);
    permissions.isProjectOwner.mockReturnValue(true);

    render(<GoalsCard {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(mockProps.updateProject).toHaveBeenCalledWith('test-project-id', {
        goals: [
          { text: 'Goal 1', completed: true },
          { text: 'Goal 2', completed: true }
        ],
        status: 'Complete'
      });
    });
  });

  test('shows add goal button only for project owner', () => {
    permissions.isProjectOwner.mockReturnValue(true);
    
    render(<GoalsCard {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /add goal/i })).toBeInTheDocument();
  });

  test('hides add goal button for non-owners', () => {
    permissions.isProjectOwner.mockReturnValue(false);
    
    render(<GoalsCard {...mockProps} />);
    
    expect(screen.queryByRole('button', { name: /add goal/i })).not.toBeInTheDocument();
  });

  test('disables checkboxes when user does not have permission', () => {
    permissions.checkPermission.mockReturnValue(false);
    permissions.isProjectOwner.mockReturnValue(false);

    render(<GoalsCard {...mockProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });

  test('handles goal deletion', async () => {
    permissions.isProjectOwner.mockReturnValue(true);
    permissions.checkPermission.mockReturnValue(true);

    render(<GoalsCard {...mockProps} />);

    // Find delete buttons by their class and aria role
    const deleteButtons = screen.getAllByRole('button', { 
      name: /delete goal:/i
    });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockProps.updateProject).toHaveBeenCalledWith('test-project-id', {
        goals: [{ text: 'Goal 2', completed: true }]
      });
    });
  });
});