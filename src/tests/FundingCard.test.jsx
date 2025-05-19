import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FundingCard from '@/components/ProjectDetailsPage/FundingCard';
import { updateProjectFunds, updateProjectExpense, getFundingHistory } from '@/backend/firebase/fundingDB';
import { checkPermission } from '@/utils/permissions';
import { notify } from '@/backend/firebase/notificationsUtil';

// Mock the firebase functions
vi.mock('@/backend/firebase/fundingDB', () => ({
  updateProjectFunds: vi.fn(),
  updateProjectExpense: vi.fn(),
  getFundingHistory: vi.fn()
}));

// Mock permissions
vi.mock('@/utils/permissions', () => ({
  checkPermission: vi.fn()
}));

// Mock notifications
vi.mock('@/backend/firebase/notificationsUtil', () => ({
  notify: vi.fn()
}));

describe('FundingCard', () => {
  const mockProject = {
    title: 'Test Project',
    availableFunds: 5000,
    usedFunds: 3000
  };

  const mockProps = {
    projectId: 'test-project-id',
    project: mockProject,
    setProject: vi.fn(),
    setModalOpen: vi.fn(),
    setError: vi.fn(),
    setStatusMessage: vi.fn()
  };

  const mockFundingHistory = [
    {
      id: '1',
      type: 'funds',
      amount: 1000,
      source: 'Initial funding',
      updatedByName: 'John Doe',
      updatedAt: { seconds: Date.now() / 1000 },
      balanceAfter: 1000
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getFundingHistory.mockResolvedValue(mockFundingHistory);
    checkPermission.mockReturnValue(true);
  });

  test('renders funding information correctly', () => {
    render(<FundingCard {...mockProps} />);

    // Check if total funds are displayed correctly (available + used)
    expect(screen.getByText('R 8,000')).toBeInTheDocument();
    
    // Check if available funds are displayed
    expect(screen.getByText('R 5,000')).toBeInTheDocument();
    
    // Check if used funds are displayed
    expect(screen.getByText('R 3,000')).toBeInTheDocument();
  });

  test('handles adding funds', async () => {
    updateProjectFunds.mockResolvedValue({ success: true });
    render(<FundingCard {...mockProps} />);

    // Open add funds modal
    fireEvent.click(screen.getByRole('button', { name: /add funds/i }));

    // Fill in the form
    const amountInput = screen.getByLabelText(/amount/i);
    const sourceInput = screen.getByLabelText(/source/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    fireEvent.change(sourceInput, { target: { value: 'Grant' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add funds$/i }));

    await waitFor(() => {
      expect(updateProjectFunds).toHaveBeenCalledWith(
        'test-project-id',
        1000,
        'Grant'
      );
    });
  });

  

  test('shows funding history', async () => {
    render(<FundingCard {...mockProps} />);

    // Click view history button
    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

    await waitFor(() => {
      expect(getFundingHistory).toHaveBeenCalledWith('test-project-id');
      expect(screen.getByText('Initial funding')).toBeInTheDocument();
    });
  });

  test('disables funding actions when user lacks permission', () => {
    checkPermission.mockReturnValue(false);
    render(<FundingCard {...mockProps} />);

    expect(screen.queryByRole('button', { name: /add funds/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add expense/i })).not.toBeInTheDocument();
  });

  test('displays loading state when adding funds', async () => {
    updateProjectFunds.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<FundingCard {...mockProps} />);

    fireEvent.click(screen.getByRole('button', { name: /add funds/i }));
    
    const amountInput = screen.getByLabelText(/amount/i);
    const sourceInput = screen.getByLabelText(/source/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    fireEvent.change(sourceInput, { target: { value: 'Grant' } });

    fireEvent.click(screen.getByRole('button', { name: /add funds$/i }));

    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  test('handles errors when adding funds', async () => {
    const error = new Error('Failed to add funds');
    updateProjectFunds.mockRejectedValue(error);
    render(<FundingCard {...mockProps} />);

    fireEvent.click(screen.getByRole('button', { name: /add funds/i }));
    
    const amountInput = screen.getByLabelText(/amount/i);
    const sourceInput = screen.getByLabelText(/source/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    fireEvent.change(sourceInput, { target: { value: 'Grant' } });

    fireEvent.click(screen.getByRole('button', { name: /add funds$/i }));

    await waitFor(() => {
      expect(mockProps.setError).toHaveBeenCalledWith(true);
      expect(mockProps.setModalOpen).toHaveBeenCalledWith(true);
      expect(mockProps.setStatusMessage).toHaveBeenCalledWith(error.message);
    });
  });
});