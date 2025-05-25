import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportDialog from '../components/ExportDialog';
import { auth } from '../backend/firebase/firebaseConfig';
import { fetchProjects } from '../backend/firebase/projectDB';


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
      'An update to ExportDialog inside a test was not wrapped in act',
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


// Mock Firebase modules
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Mock project data
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn()
}));

describe('ExportDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onExport: vi.fn(),
    type: 'projects',
    format: 'pdf',
    loading: false
  };

  const mockProjects = [
    { id: '1', title: 'Project 1' },
    { id: '2', title: 'Project 2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fetchProjects.mockResolvedValue(mockProjects);
  });

  it('renders dialog when isOpen is true', () => {
    render(<ExportDialog {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Export Projects Report/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ExportDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads and displays projects', async () => {
    render(<ExportDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
    
    expect(fetchProjects).toHaveBeenCalledWith('test-user-id');
  });

  it('handles date range selection', () => {
    render(<ExportDialog {...defaultProps} />);
    
    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2025-12-31' } });
    
    expect(startDateInput.value).toBe('2025-01-01');
    expect(endDateInput.value).toBe('2025-12-31');
  });

  it('handles project selection', async () => {
    render(<ExportDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });
    
    const checkbox = screen.getByLabelText('Project 1');
    fireEvent.click(checkbox);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith('projects', 'pdf', {
      startDate: null,
      endDate: null,
      projectIds: ['1']
    });
  });

  it('shows loading state', () => {
    render(<ExportDialog {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeDisabled();
  });

  it('closes dialog when cancel button is clicked', () => {
    render(<ExportDialog {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows initial loading state for projects', async () => {
    render(<ExportDialog {...defaultProps} />);
    
    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });
  });

  it('handles empty projects list', async () => {
    fetchProjects.mockResolvedValueOnce([]);
    render(<ExportDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
    });
  });

  it('handles export with date range and selected projects', async () => {
    render(<ExportDialog {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });
    
    // Set date range
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2025-12-31' } });
    
    // Select projects
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Select first project
    fireEvent.click(checkboxes[1]); // Select second project
    
    // Click export
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(defaultProps.onExport).toHaveBeenCalledWith('projects', 'pdf', {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      projectIds: ['1', '2']
    });
  });
});