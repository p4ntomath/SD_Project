import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import AuthContext from '../context/AuthContext';
import '@testing-library/jest-dom';

// Import the mocked functions directly
import { fetchProject,} from '../backend/firebase/projectDB';
import { fetchDocumentsByFolder } from '../backend/firebase/documentsDB';
import { getReviewerRequestsForProject, } from '../backend/firebase/reviewerDB';
import { getPendingCollaboratorInvitations, updateCollaboratorAccessLevel, removeCollaboratorFromProject } from '../backend/firebase/collaborationDB';
import { isProjectOwner, checkPermission } from '../utils/permissions';

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({
      projectId: 'test-project-id'
    })
  };
});

// Mock Firebase functions and auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  db: {}
}));

vi.mock('../backend/firebase/projectDB', () => ({
  fetchProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectDetails: vi.fn()
}));

vi.mock('../backend/firebase/documentsDB', () => ({
  fetchDocumentsByFolder: vi.fn()
}));

vi.mock('../backend/firebase/reviewerDB', () => ({
  getReviewerRequestsForProject: vi.fn(),
  updateExistingReviewerInfo: vi.fn()
}));

vi.mock('../backend/firebase/collaborationDB', () => ({
  getPendingCollaboratorInvitations: vi.fn(),
  updateCollaboratorAccessLevel: vi.fn(),
  removeCollaboratorFromProject: vi.fn(),
  sendResearcherInvitation: vi.fn()
}));

vi.mock('../backend/firebase/notificationsUtil', () => ({
  notify: vi.fn()
}));

vi.mock('../backend/firebase/chatDB', () => ({
  ChatService: {
    getUserChats: vi.fn(),
    createProjectGroupChat: vi.fn()
  }
}));

// Mock permissions utils
vi.mock('../utils/permissions', () => ({
  isProjectOwner: vi.fn(),
  checkPermission: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>
  },
  AnimatePresence: ({ children }) => children
}));

// Suppress act() warnings and controlled input warning
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const skipMessages = [
      'Warning: Invalid value for prop',
      'changing a controlled input to be uncontrolled'
    ];
    // Check if first arg exists and is a string before calling includes
    if (typeof args[0] === 'string' && skipMessages.some(msg => args[0].includes(msg))) return;
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const skipMessages = [
      'An update to ProjectDetailsPage inside a test was not wrapped in act',
      'A component is changing a controlled input'
    ];
    if (skipMessages.some(msg => args[0]?.includes(msg))) return;
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe('ProjectDetailsPage', () => {
  const mockProject = {
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test Description',
    status: 'In Progress',
    researcherName: 'Test Researcher',
    goals: [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: false }
    ],
    collaborators: [
      { id: 'collaborator1', fullName: 'Test Collaborator', accessLevel: 'Editor' }
    ],
    availableFunds: 1000,
    usedFunds: 500
  };

  const mockAuthContext = {
    user: { uid: 'test-user-id' },
    role: 'researcher'
  };

  const renderProjectDetailsPage = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <ProjectDetailsPage />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock implementations for imported mocks
    fetchProject.mockResolvedValue(mockProject);
    fetchDocumentsByFolder.mockResolvedValue([]);
    getReviewerRequestsForProject.mockResolvedValue([]);
    getPendingCollaboratorInvitations.mockResolvedValue([]);
    
    // Set up permission mock defaults
    isProjectOwner.mockReturnValue(true);
    checkPermission.mockReturnValue(true);
  });

  test('displays loading state initially', () => {
    renderProjectDetailsPage();
    const loadingIndicator = screen.getByLabelText('loading-project');
    expect(loadingIndicator).toBeInTheDocument();
  });

  test('displays project details when loaded', async () => {
    renderProjectDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Researcher')).toBeInTheDocument();
    });
  });

  test('shows project progress based on completed goals', async () => {
    renderProjectDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  test('allows editing project when user has permission', async () => {
    renderProjectDetailsPage();

    await waitFor(() => {
      const editButton = screen.getByText(/edit project/i);
      expect(editButton).toBeInTheDocument();
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      const backButton = screen.getByText(/back to details/i);
      expect(backButton).toBeInTheDocument();
    });
  });

  test('handles collaborator access level changes', async () => {
    updateCollaboratorAccessLevel.mockResolvedValueOnce();
    renderProjectDetailsPage();

    await waitFor(() => {
      const accessLevelSelect = screen.getByDisplayValue('Editor');
      expect(accessLevelSelect).toBeInTheDocument();
      fireEvent.change(accessLevelSelect, { target: { value: 'Viewer' } });
    });

    expect(updateCollaboratorAccessLevel).toHaveBeenCalledWith(
      'test-project-id',
      'collaborator1',
      'Viewer'
    );
  });

  test('handles collaborator removal', async () => {
    removeCollaboratorFromProject.mockResolvedValueOnce();
    renderProjectDetailsPage();

    await waitFor(() => {
      const removeButton = screen.getByTitle(/remove collaborator/i);
      expect(removeButton).toBeInTheDocument();
      fireEvent.click(removeButton);
    });

    expect(removeCollaboratorFromProject).toHaveBeenCalledWith(
      'test-project-id',
      'collaborator1'
    );
  });

  test('displays funding information correctly', async () => {
    renderProjectDetailsPage();

    await waitFor(() => {
      expect(screen.getByText(/R 1,000/)).toBeInTheDocument(); // Available funds
      expect(screen.getByText(/R 500/)).toBeInTheDocument(); // Used funds
    });
  });

  test('shows error state when project fails to load', async () => {
    const errorMessage = 'Failed to load project';
    fetchProject.mockRejectedValueOnce(new Error(errorMessage));
    renderProjectDetailsPage();

    await waitFor(() => {
      expect(screen.getByText('Project Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The project you are looking for does not exist or has been deleted./i)).toBeInTheDocument();
    });
  });
});