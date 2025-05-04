import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminUsersPage from '../pages/AdminUsersPage';
import { fetchAllUsers } from '../backend/firebase/adminAccess';
import '@testing-library/jest-dom/vitest';

const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (args[0]?.includes('inside a test was not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: (props) => <div {...props} />,
  },
  AnimatePresence: ({ children }) => children,
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
    role: 'supervisor',
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

  it('renders loading state initially', () => {
    renderAdminUsersPage();
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('displays users after loading', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters users by role', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/Filter by Role/i);
    fireEvent.change(filterSelect, { target: { value: 'researcher' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters users by status', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/Filter by Status/i);
    fireEvent.change(filterSelect, { target: { value: 'pending' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('navigates back to admin dashboard when back button is clicked', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back to dashboard');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('navigates to user details when view details is clicked', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByTestId('view-details-1');
    fireEvent.click(viewDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users/1');
  });

  it('handles error state when fetching users fails', async () => {
    fetchAllUsers.mockRejectedValue(new Error('Failed to fetch'));
    
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('displays user details correctly in table', async () => {
    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Test elements that appear in both mobile and desktop views
    expect(screen.getAllByText('john@example.com')).toHaveLength(2);
    expect(screen.getAllByText('jane@example.com')).toHaveLength(2);
    
    // Test roles that appear in both dropdown and table
    expect(screen.getAllByText('researcher')).toHaveLength(2);
    expect(screen.getAllByText('supervisor')).toHaveLength(2);
    
    // Test status in desktop and mobile views
    expect(screen.getByTestId('user-status-desktop-1')).toHaveTextContent(/active/i);
    expect(screen.getByTestId('user-status-mobile-1')).toHaveTextContent(/active/i);
    expect(screen.getByTestId('user-status-desktop-2')).toHaveTextContent(/pending/i);
    expect(screen.getByTestId('user-status-mobile-2')).toHaveTextContent(/pending/i);
    
    // Test names which appear once
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
