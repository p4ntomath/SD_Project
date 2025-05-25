import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import FundingTrackerPage from '../pages/FundingTrackerPage';
import { act } from '@testing-library/react';


// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock firebase modules
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn(() => Promise.resolve([
    {
      id: '1',
      title: 'Test Project 1',
      availableFunds: 10000,
      usedFunds: 5000,
      status: 'In Progress'
    },
    {
      id: '2',
      title: 'Test Project 2',
      availableFunds: 20000,
      usedFunds: 2000,
      status: 'Active'
    }
  ]))
}));

vi.mock('../backend/firebase/fundingDB', () => ({
  fetchFunding: vi.fn(() => Promise.resolve([
    {
      id: '1',
      funding_name: 'Green Energy Fund',
      expected_funds: '500000',
      external_link: 'https://example.com/fund',
      status: 'active',
      category: 'renewable_energy',
      description: 'Funding for green energy projects',
      eligibility: 'Open to all researchers',
      deadline: '2025-12-31'
    }
  ]))
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

describe('FundingTrackerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });
    
    expect(screen.getByText('Track Funding')).toBeInTheDocument();
    
  });

  it('loads and displays projects with funding information', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('R 10,000')).toBeInTheDocument();
      expect(screen.getByText('R 5,000')).toBeInTheDocument();
      expect(screen.getByText('33.3% utilized')).toBeInTheDocument(); // For Test Project 1
    });
  });

  it('displays funding opportunities with detailed information', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Green Energy Fund')).toBeInTheDocument();
      expect(screen.getByText('Active', { selector: 'span.px-3.py-1.rounded-full.text-xs.font-medium' })).toBeInTheDocument();
      expect(screen.getByText('Funding for green energy projects')).toBeInTheDocument();
      expect(screen.getByText('Open to all researchers')).toBeInTheDocument();
      expect(screen.getByText('31 December 2025')).toBeInTheDocument();
    });
  });

  it('calculates and displays total funds correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      const availableFundsEl = screen.getByTestId('total-available-funds-value');
      expect(availableFundsEl).toHaveTextContent('R 30,000');
      
      const usedFundsEl = screen.getByTestId('total-used-funds-value');
      expect(usedFundsEl).toHaveTextContent('R 7,000');
      
      const utilizationRateEl = screen.getByTestId('utilization-rate-value');
      expect(utilizationRateEl).toHaveTextContent('18.9%');
    });
  });

  it('handles loading state for funding opportunities', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    // Loading state should be present initially
    expect(screen.queryByText('No funding opportunities available at the moment.')).not.toBeInTheDocument();

    // After loading completes
    await waitFor(() => {
      expect(screen.getByText('Green Energy Fund')).toBeInTheDocument();
      expect(screen.getByText('Apply Now')).toBeInTheDocument();
    });
  });



  it('shows correct utilization rate', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      // Find utilization rate element using data-testid
      const utilizationRateEl = screen.getByTestId('utilization-rate-value');
      expect(utilizationRateEl).toBeInTheDocument();
      expect(utilizationRateEl).toHaveClass('text-xl md:text-2xl font-bold text-blue-600');
      expect(utilizationRateEl).toHaveTextContent('18.9%');
    });
  });

  it('handles projects with no funding data', async () => {
    // Override the mock for this specific test
    const { fetchProjects } = await import('../backend/firebase/projectDB');
    vi.mocked(fetchProjects).mockResolvedValueOnce([
      {
        id: '3',
        title: 'Project Without Funding',
        status: 'New'
      }
    ]);

    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Project Without Funding')).toBeInTheDocument();
      // Check for Available Funds
      expect(screen.getByText(/Available:/).nextElementSibling).toHaveTextContent('R 0');
      // Check for Used Funds
      expect(screen.getByText(/Used:/).nextElementSibling).toHaveTextContent('R 0');
      // Check utilization percentage with decimal point
      expect(screen.getByText('0.0% utilized')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    // Override the mock to simulate an error
    const { fetchProjects } = await import('../backend/firebase/projectDB');
    vi.mocked(fetchProjects).mockRejectedValueOnce(new Error('Failed to fetch'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching projects:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });


  it('displays funding opportunity section correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    // First wait for projects to load (any project title will do)
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Then check the funding opportunity section
    expect(screen.getByText('Need Funding?')).toBeInTheDocument();
    expect(screen.getByText('Green Energy Fund')).toBeInTheDocument();
  });
});