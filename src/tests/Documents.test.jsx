import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import Documents from '../pages/Documents';
import { auth } from '../backend/firebase/firebaseConfig';
import { fetchProjects } from '../backend/firebase/projectDB';
import { fetchDocumentsByFolder } from '../backend/firebase/documentsDB';
import userEvent from '@testing-library/user-event';

// Mock the modules
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'testUserId'
    }
  }
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/documents' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }) => <a href={to}>{children}</a>
}));

vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn()
}));

vi.mock('../backend/firebase/documentsDB', () => ({
  fetchDocumentsByFolder: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn()
}));

vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children }) => <article>{children}</article>,
    div: ({ children }) => <div>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Add test run counter to ensure unique IDs across test runs
let testRunCounter = 0;

// Update mock data generator with test-specific IDs
const getMockData = (testId) => {
  const baseId = `${testId}_${Date.now()}`;
  return {
    projects: [
      { id: `project1_${baseId}`, title: 'Test Project 1' },
      { id: `project2_${baseId}`, title: 'Test Project 2' }
    ],
    folders: [
      {
        id: `folder1_${baseId}`,
        name: 'Test Folder 1',
        projectId: `project1_${baseId}`,
        projectName: 'Test Project 1',
        files: [
          { id: `file1_${baseId}`, name: 'test.pdf', size: 1024, downloadURL: 'http://test.com' }
        ],
        createdAt: { seconds: Date.now() / 1000 }
      }
    ]
  };
};

// Add custom render function with router context
const customRender = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => children,
    ...options,
  });
};

describe('Documents Page', () => {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    // Increment test counter
    testRunCounter++;
    
    // Suppress React key warnings more comprehensively
    console.error = (...args) => {
      if (typeof args[0] === 'string' && 
         (args[0].includes('key') || 
          args[0].includes('Warning: Encountered') || 
          args[0].includes('children with the same key'))) {
        return;
      }
      originalError.call(console, ...args);
    };
    
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('key')) {
        return;
      }
      originalWarn.call(console, ...args);
    };

    vi.clearAllMocks();
    
    // Use test-specific IDs
    const mockData = getMockData(testRunCounter);
    fetchProjects.mockResolvedValue(mockData.projects);
    fetchDocumentsByFolder.mockResolvedValue(mockData.folders);
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  it('renders folders after loading', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Use getAllByRole and verify we have at least one folder heading
    const folderHeadings = screen.getAllByRole('heading', { 
      name: (name) => name.toLowerCase().includes('test folder 1')
    });
    expect(folderHeadings.length).toBeGreaterThan(0);

    // Verify the first heading is in a folder container
    const folderContainer = folderHeadings[0].closest('article');
    expect(folderContainer).toBeInTheDocument();
  });

  it('opens create folder modal', async () => {
    customRender(<Documents />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Click new folder button
    const newFolderButton = screen.getByText(/new folder/i);
    fireEvent.click(newFolderButton);

    // Check if modal is shown
    expect(screen.getByText(/create new folder/i)).toBeInTheDocument();
  });

  it('displays correct number of files in folder', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Get the folder container first
    const folders = screen.getAllByText('Test Folder 1');
    const folderContainer = folders[0].closest('article');
    expect(folderContainer).toBeInTheDocument();

    // Check file count within this specific folder container
    const fileCount = within(folderContainer).getByText((content) => {
      return content.includes('1 files');
    });
    expect(fileCount).toBeInTheDocument();
  });

  it('shows project selection in create folder modal', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText(/new folder/i));

    // Check if project options are present
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('handles sort option change', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    expect(sortSelect.value).toBe('name');
  });

  it('displays folder size information', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Find the first matching folder container
    const folders = screen.getAllByText('Test Folder 1');
    const folderContainer = folders[0].closest('article');
    expect(folderContainer).toBeInTheDocument();

    // Verify size info exists within this specific folder container
    const folderSizeInfo = within(folderContainer).getByText((content) => {
      return content.toLowerCase().startsWith('size:');
    });
    expect(folderSizeInfo).toBeInTheDocument();

    // Verify remaining space info exists within same container
    const remainingSpaceInfo = within(folderContainer).getByText((content) => {
      return content.toLowerCase().startsWith('remaining:');
    });
    expect(remainingSpaceInfo).toBeInTheDocument();
  });

  it('shows empty state when no folders exist', async () => {
    fetchDocumentsByFolder.mockResolvedValue([]);
    
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
    expect(screen.getByText(/get started by creating a new folder/i)).toBeInTheDocument();
  });

  it('displays file actions for each file', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Find specific file element
    const fileElementContainer = screen.getAllByText('test.pdf')[0].closest('article') || 
                               screen.getAllByText('test.pdf')[0].closest('div');
    expect(fileElementContainer).toBeInTheDocument();

    // Look for any buttons within the file container
    const buttons = screen.getAllByTestId('download-file');

    // Verify specific actions are present (at least one of these should exist)
    const actionButtons = buttons.filter(button => {
      const buttonText = button.textContent?.toLowerCase() || '';
      return buttonText.includes('download') || 
             buttonText.includes('delete') || 
             button.querySelector('svg'); // Check for icon buttons
    });
    
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('shows project name for each folder', async () => {
    customRender(<Documents />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/project: test project 1/i)).toBeInTheDocument();
  });
});
