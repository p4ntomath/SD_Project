import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminProjectsPage from '../pages/AdminProjectsPage';
import { fetchProjectsWithUsers } from '../backend/firebase/adminAccess';
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

// Mock MainNav and MobileBottomNav components
vi.mock('../components/AdminComponents/Navigation/AdminMainNav', () => ({
  default: () => <div data-testid="mock-main-nav">MainNav</div>
}));

vi.mock('../components/AdminComponents/Navigation/AdminMobileBottomNav', () => ({
  default: () => <div data-testid="mock-bottom-nav">BottomNav</div>
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock the external dependencies
vi.mock('../backend/firebase/adminAccess', () => ({
  fetchProjectsWithUsers: vi.fn()
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaArrowLeft: () => <div data-testid="mock-arrow-icon" />
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: () => <div aria-label="loading">Loading...</div>
}));

const mockProjects = [
  {
    id: '1',
    title: 'Test Project 1',
    userFullName: 'John Doe',
    status: 'In Progress',
    researchField: 'Computer Science'
  },
  {
    id: '2',
    title: 'Test Project 2',
    userFullName: 'Jane Doe',
    status: 'Completed',
    researchField: 'Biology'
  }
];

describe('AdminProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchProjectsWithUsers.mockResolvedValue(mockProjects);
  });

  const renderAdminProjectsPage = () => {
    render(
      <BrowserRouter>
        <AdminProjectsPage />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    renderAdminProjectsPage();
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('displays projects after loading', async () => {
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('filters projects by creator', async () => {
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/Filter by Creator/i);
    fireEvent.change(filterSelect, { target: { value: 'John Doe' } });

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
  });

  it('navigates back to admin dashboard when back button is clicked', async () => {
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back to dashboard');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('navigates to project details when view details is clicked', async () => {
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/projects/1');
  });

  it('handles error state when fetching projects fails', async () => {
    fetchProjectsWithUsers.mockRejectedValue(new Error('Failed to fetch'));
    
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('displays all creators in filter dropdown', async () => {
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/Filter by Creator/i);
    const options = screen.getAllByRole('option');
    
    expect(filterSelect).toHaveValue('all');
    expect(options[0]).toHaveTextContent('All Creators');
    expect(options).toHaveLength(3); // All Creators + 2 usernames
    expect(options[1]).toHaveTextContent('John Doe');
    expect(options[2]).toHaveTextContent('Jane Doe');
  });

  it('displays correct project details in table', async () => {
    renderAdminProjectsPage();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows spinner while loading', () => {
    // pending promise
    fetchProjectsWithUsers.mockReturnValue(new Promise(() => {}));
    render(
      <BrowserRouter>
        <AdminProjectsPage />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
    expect(screen.getByTestId('mock-main-nav')).toBeInTheDocument();
    expect(screen.getByTestId('mock-bottom-nav')).toBeInTheDocument();
  });

  it('renders empty state when no projects', async () => {
    fetchProjectsWithUsers.mockResolvedValue([]);
    render(
      <BrowserRouter>
        <AdminProjectsPage />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
    });
  });

  it('renders table rows and View Details buttons', async () => {
    const projects = [
      { id: '1', title: 'Proj1', userFullName: 'Alice', status: 'Active', researchField: 'Bio' },
      { id: '2', title: 'Proj2', userFullName: 'Bob', status: 'In Progress', researchField: 'Chem' }
    ];
    fetchProjectsWithUsers.mockResolvedValue(projects);
    render(
      <BrowserRouter>
        <AdminProjectsPage />
      </BrowserRouter>
    );
    // Wait until loading is finished
    await waitFor(() => expect(screen.queryByLabelText('loading')).not.toBeInTheDocument());
    const buttons = screen.getAllByText('View Details');
    expect(buttons).toHaveLength(2);
    // click first button
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/projects/1');
  });
});
