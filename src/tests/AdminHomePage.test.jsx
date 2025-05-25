import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminHomePage from '../pages/AdminHomePage';
import { fetchAllUsers, fetchProjectsWithUsers, getAllFunding } from '../backend/firebase/adminAccess';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import '@testing-library/jest-dom/vitest';

// Mock console errors
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (args[0]?.includes('inside a test was not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

// Mock dependencies
vi.mock('../components/AdminComponents/Navigation/AdminMainNav', () => ({
  default: () => <div data-testid="mock-main-nav">MainNav</div>
}));

vi.mock('../components/AdminComponents/Navigation/AdminMobileBottomNav', () => ({
  default: () => <div data-testid="mock-bottom-nav">BottomNav</div>
}));

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock admin access functions
vi.mock('../backend/firebase/adminAccess', () => ({
  fetchAllUsers: vi.fn(),
  fetchProjectsWithUsers: vi.fn(),
  getAllFunding: vi.fn()
}));

vi.mock('../backend/firebase/documentsDB', () => ({
  fetchAllDocuments: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock data
const mockData = {
  users: [{ id: '1', name: 'User 1' }, { id: '2', name: 'User 2' }],
  projects: [{ id: '1', title: 'Project 1' }, { id: '2', title: 'Project 2' }],
  funding: [{ id: '1', name: 'Funding 1' }, { id: '2', name: 'Funding 2' }],
  documents: [{ id: '1', name: 'Doc 1' }, { id: '2', name: 'Doc 2' }]
};

describe('AdminHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAllUsers.mockResolvedValue(mockData.users);
    fetchProjectsWithUsers.mockResolvedValue(mockData.projects);
    getAllFunding.mockResolvedValue(mockData.funding);
    fetchAllDocuments.mockResolvedValue(mockData.documents);
  });

  const renderAdminHomePage = () => {
    render(
      <BrowserRouter>
        <AdminHomePage />
      </BrowserRouter>
    );
  };


  it('displays dashboard statistics after loading', async () => {
    renderAdminHomePage();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Get specific stats using data-testid
    const usersCard = screen.getByTestId('total-users-card');
    const projectsCard = screen.getByTestId('active-projects-card');
    const fundingCard = screen.getByTestId('funding-opportunities-card');
    const documentsCard = screen.getByTestId('total-documents-card');

    // Check stats within their respective cards
    expect(within(usersCard).getByText('2')).toBeInTheDocument();
    expect(within(projectsCard).getByText('2')).toBeInTheDocument();
    expect(within(fundingCard).getByText('2')).toBeInTheDocument();
    expect(within(documentsCard).getByText('2')).toBeInTheDocument();
  });

  it('navigates to funding page when funding card is clicked', async () => {
    renderAdminHomePage();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const fundingCard = screen.getByTestId('funding-opportunities-card');
    fireEvent.click(fundingCard);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/funding');
  });

  it('navigates to correct pages when clicking dashboard cards', async () => {
    renderAdminHomePage();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Test navigation for each card
    fireEvent.click(screen.getByTestId('total-users-card'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');

    fireEvent.click(screen.getByTestId('active-projects-card'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/projects');

    fireEvent.click(screen.getByTestId('total-documents-card'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/documents');
  });

  it('handles errors in data fetching', async () => {
    // Mock all fetch functions to reject
    const error = new Error('Failed to fetch data');
    fetchAllUsers.mockRejectedValue(error);
    fetchProjectsWithUsers.mockRejectedValue(error);
    getAllFunding.mockRejectedValue(error);
    fetchAllDocuments.mockRejectedValue(error);

    renderAdminHomePage();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    // Verify error state by checking stats are zero
    const stats = screen.getAllByText('0');
    expect(stats).toHaveLength(4); // All stats should show 0

    // Check for empty project table
    const tbody = screen.getAllByRole('rowgroup')[1]; // Get table body
    expect(tbody.children).toHaveLength(0); // Should have no rows in tbody
  });
});
