import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminUsersPage from '../pages/AdminUsersPage';
import { fetchAllUsers } from '../backend/firebase/adminAccess';
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

vi.mock('react-icons/fa', () => ({
  FaArrowLeft: () => <div data-testid="mock-arrow-icon" />
}));

vi.mock('react-spinners', () => ({
  ClipLoader: () => <div aria-label="loading">Loading...</div>
}));

vi.mock('../backend/firebase/adminAccess', () => ({
  fetchAllUsers: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUsers = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'researcher',
    status: 'active'
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    role: 'reviewer',
    status: 'pending'
  }
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAllUsers.mockResolvedValue(mockUsers);
  });

  const renderAdminUsersPage = () => {
    render(
      <BrowserRouter>
        <AdminUsersPage />
      </BrowserRouter>
    );
  };

  it('displays users after loading', async () => {
    renderAdminUsersPage();
    
    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    // Get table rows
    const rows = screen.getAllByRole('row');
    
    // Check first user (row 1 after header)
    const firstUserRow = rows[1];
    expect(within(firstUserRow).getByText('John Doe')).toBeInTheDocument();
    const firstUserEmailCell = within(firstUserRow).getAllByRole('cell')[1];
    expect(firstUserEmailCell).toHaveTextContent('john@example.com');
    
    // Check second user (row 2 after header)
    const secondUserRow = rows[2];
    expect(within(secondUserRow).getByText('Jane Smith')).toBeInTheDocument();
    const secondUserEmailCell = within(secondUserRow).getAllByRole('cell')[1];
    expect(secondUserEmailCell).toHaveTextContent('jane@example.com');
  });

  it('filters users by role', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    const roleFilter = screen.getByLabelText(/Filter by Role/i);
    fireEvent.change(roleFilter, { target: { value: 'researcher' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  

  it('navigates back to admin dashboard when back button is clicked', async () => {
    renderAdminUsersPage();
    
    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back to dashboard');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('navigates to user details when view details is clicked', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users/1');
  });

  it('handles error state when fetching users fails', async () => {
    // Silence console.error for this test
    const originalError = console.error;
    console.error = vi.fn();
    
    fetchAllUsers.mockRejectedValueOnce(new Error('Failed to fetch'));
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No users found')).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalError;
  });

  it('displays user details correctly in table', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    
    // First user row (index 1 because index 0 is header)
    const firstRow = rows[1];
    const firstRowCells = within(firstRow).getAllByRole('cell');
    
    expect(within(firstRowCells[0]).getByText('John Doe')).toBeInTheDocument();
    expect(within(firstRowCells[1]).getByText('john@example.com')).toBeInTheDocument();
    expect(within(firstRowCells[2]).getByText('researcher')).toBeInTheDocument();
    expect(screen.getByTestId('user-status-desktop-1')).toHaveTextContent('active');
    
    // Second user row
    const secondRow = rows[2];
    const secondRowCells = within(secondRow).getAllByRole('cell');
    
    expect(within(secondRowCells[0]).getByText('Jane Smith')).toBeInTheDocument();
    expect(within(secondRowCells[1]).getByText('jane@example.com')).toBeInTheDocument();
    expect(within(secondRowCells[2]).getByText('reviewer')).toBeInTheDocument();
    expect(screen.getByTestId('user-status-desktop-2')).toHaveTextContent('pending');
  });
});
