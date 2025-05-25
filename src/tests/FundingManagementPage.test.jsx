import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import FundingManagementPage from '../pages/FundingManagementPage';
import { getAllFunding, createFunding, updateFunding, deleteFunding } from '../backend/firebase/adminAccess';

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



// Mock Firebase modules and navigation
vi.mock('../backend/firebase/adminAccess', () => ({
  getAllFunding: vi.fn(),
  createFunding: vi.fn(),
  updateFunding: vi.fn(),
  deleteFunding: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('FundingManagementPage', () => {
  const mockFunding = [
    {
      id: 'fund1',
      funding_name: 'Research Grant 2025',
      expected_funds: 100000,
      external_link: 'https://example.com',
      deadline: '2025-12-31',
      category: 'research_grant',
      eligibility: 'PhD researchers',
      description: 'Grant for research projects',
      status: 'active'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getAllFunding.mockResolvedValue(mockFunding);
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <FundingManagementPage />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays funding opportunities after loading', async () => {
    render(
      <BrowserRouter>
        <FundingManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('funding-table')).toBeInTheDocument();
    });

    expect(screen.getByTestId('funding-amount')).toHaveTextContent('R100,000');
    expect(screen.getByTestId('funding-status')).toHaveTextContent(/active/i);
  });

  it('opens add funding modal', async () => {
    render(
      <BrowserRouter>
        <FundingManagementPage />
      </BrowserRouter>
    );

    const addButton = await screen.findByTestId('add-funding-button');
    fireEvent.click(addButton);

    expect(screen.getByTestId('funding-modal')).toBeInTheDocument();
    expect(screen.getByTestId('funding-name-input')).toBeInTheDocument();
  });



  it('handles editing existing funding', async () => {
    render(
      <BrowserRouter>
        <FundingManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('funding-table')).toBeInTheDocument();
    });

    const editButton = screen.getByTestId('edit-button-fund1');
    fireEvent.click(editButton);

    expect(screen.getByTestId('funding-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('funding-name-input'), {
      target: { value: 'Updated Grant' }
    });

    const saveButton = screen.getByTestId('submit-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateFunding).toHaveBeenCalledWith('fund1', expect.objectContaining({
        funding_name: 'Updated Grant'
      }));
    });
  });

  it('handles funding deletion', async () => {
    render(
      <BrowserRouter>
        <FundingManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('funding-table')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-button-fund1');
    fireEvent.click(deleteButton);

    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteFunding).toHaveBeenCalledWith('fund1');
    });
  });

  it('filters funding opportunities', async () => {
    render(
      <BrowserRouter>
        <FundingManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('funding-table')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'research' } });

    expect(screen.getByTestId('funding-row-fund1')).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: '' } });

    const statusFilter = screen.getByTestId('status-filter');
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    expect(screen.getByTestId('funding-row-fund1')).toBeInTheDocument();
  });

  
});