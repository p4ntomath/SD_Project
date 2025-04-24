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
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('loads and displays projects with funding information', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FundingTrackerPage />
        </MemoryRouter>
      );
    });

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Check if funding information is displayed
    expect(screen.getByText('R 10,000')).toBeInTheDocument();
    expect(screen.getByText('R 5,000')).toBeInTheDocument();
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
      // Total Available Funds = 10000 + 20000 = 30000
      const availableFundsEl = screen.getByTestId('total-available-funds-value');
      expect(availableFundsEl).toHaveTextContent('R 30,000');
      expect(availableFundsEl).toHaveClass('text-2xl', 'font-bold', 'text-green-600');
      
      // Total Used Funds = 5000 + 2000 = 7000
      const usedFundsEl = screen.getByTestId('total-used-funds-value');
      expect(usedFundsEl).toHaveTextContent('R 7,000');
    });
  });

  it('filters projects based on search query', async () => {
    render(
      <MemoryRouter>
        <FundingTrackerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Test Project 2' } });

    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  

  it('navigates back when back button is clicked', async () => {
    render(
      <MemoryRouter>
        <FundingTrackerPage />
      </MemoryRouter>
    );
  
    const backButton = screen.getByTestId('back-button');
  
    await act(async () => {
      fireEvent.click(backButton);
    });
  
    expect(mockNavigate).toHaveBeenCalledWith(-1);
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
      expect(utilizationRateEl).toHaveClass('text-2xl', 'font-bold', 'text-blue-600');
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

  it('handles empty search results appropriately', async () => {
    render(
      <MemoryRouter>
        <FundingTrackerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Non-existent Project' } });

    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
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
    expect(screen.getByText('Up to R500,000 available')).toBeInTheDocument();
  });
});