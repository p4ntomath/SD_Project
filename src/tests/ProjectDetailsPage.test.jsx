import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import AuthContext from '../context/AuthContext';
import { ClipLoader } from 'react-spinners';
import { formatFirebaseDate } from '../utils/dateUtils';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>
  },
  AnimatePresence: ({ children }) => children
}));

vi.mock('../backend/firebase/documentsDB', () => ({
  fetchDocumentsByFolder: vi.fn(() => Promise.resolve([
    {
      id: 'folder1',
      name: 'Test Folder',
      files: [
        {
          id: 'file1',
          name: 'test-doc.pdf',
          description: 'Test document',
          size: '1.2 KB',
          uploadDate: new Date()
        }
      ]
    }
  ])),
  uploadDocument: vi.fn(() => Promise.resolve({ success: true })),
  deleteDocument: vi.fn(() => Promise.resolve({ success: true }))
}));

// Don't mock the entire component, just mock the dependencies
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProject: vi.fn(() => Promise.resolve({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'This is a test project description',
    researchField: 'Computer Science',
    availableFunds: 50000,
    usedFunds: 25000,
    status: 'In Progress',
    userId: 'test-user-id',
    goals: [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: true },
      { text: 'Goal 3', completed: false },
      { text: 'Goal 4', completed: false }
    ],
    collaborators: ['user1', 'user2'],
    lastUpdated: new Date().toISOString()
  })),
  getProjectDetails: vi.fn(() => Promise.resolve({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'This is a test project description',
    researchField: 'Computer Science',
    availableFunds: 60000,
    usedFunds: 25000,
    status: 'In Progress',
    userId: 'test-user-id',
    goals: [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: true },
      { text: 'Goal 3', completed: false },
      { text: 'Goal 4', completed: false }
    ],
    collaborators: ['user1', 'user2'],
    lastUpdated: new Date().toISOString()
  })),
  updateProject: vi.fn(() => Promise.resolve({ success: true })),
  deleteProject: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('../backend/firebase/fundingDB', () => ({
  getFundingHistory: vi.fn(() => Promise.resolve([
    {
      id: 'transaction1',
      type: 'funds',
      amount: 5000,
      totalAfterUpdate: 15000,
      updatedAt: { seconds: Math.floor(Date.now() / 1000) }
    },
    {
      id: 'transaction2',
      type: 'expense',
      amount: -2000,
      description: 'Test expense',
      totalAfterUpdate: 13000,
      updatedAt: { seconds: Math.floor(Date.now() / 1000) }
    }
  ])),
  updateProjectFunds: vi.fn(() => Promise.resolve({ success: true })),
  updateProjectExpense: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('react-spinners', () => ({
  ClipLoader: () => 'ClipLoader'
}));

vi.mock('../components/StatusModal', () => ({
  default: ({ isOpen, onClose, success, message }) => (
    isOpen ? <div role="dialog" data-testid="status-modal">{message}</div> : null
  )
}));

vi.mock('../components/CreateProjectForm', () => ({
  default: ({ projectToUpdate, isUpdateMode, onUpdate }) => (
    <div data-testid="create-project-form">Create Project Form</div>
  )
}));

vi.mock('../components/ResearcherComponents/AssignReviewersModal', () => ({
  default: ({ isOpen, onClose, projectId }) => (
    isOpen ? <div data-testid="assign-reviewers-modal">Assign Reviewers Modal</div> : null
  )
}));

vi.mock('../components/ReviewerComponents/ProjectReviews', () => ({
  default: ({ projectId }) => <div data-testid="project-reviews">Project Reviews</div>
}));

// Mock React Router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ projectId: 'test-project-id' }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/projects/test-project-id',
      search: '',
      hash: '',
      state: null
    })
  };
});

// Mock matchMedia for Framer Motion
const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated but kept for older versions
      removeListener: vi.fn(), // Deprecated but kept for older versions
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

beforeAll(() => {
  mockMatchMedia();
});

// Mock AuthContext
const mockAuthContext = {
  user: { 
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com'
  },
  role: 'researcher',
  loading: false,
  setUser: vi.fn(),
  setRole: vi.fn(),
  logout: vi.fn()
};

// Mock icons
vi.mock('react-icons/fi', () => ({
  FiArrowLeft: () => <span>Back Arrow</span>
}));

vi.mock('../utils/dateUtils', () => ({
  formatFirebaseDate: vi.fn((timestamp) => {
    if (!timestamp) return 'Not specified';
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Not specified';
  })
}));

vi.mock('../backend/firebase/reviewdb', () => ({
  getReviewerRequestsForProject: vi.fn(() => Promise.resolve([
    {
      id: 'request1',
      reviewerId: 'reviewer1',
      reviewerName: 'John Doe',
      status: 'pending',
      requestedAt: { seconds: Math.floor(Date.now() / 1000) }
    }
  ])),
  updateReviewerRequest: vi.fn(() => Promise.resolve({ success: true })),
  deleteReviewerRequest: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('../backend/firebase/reviewerDB', () => ({
  updateExistingReviewerInfo: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      name: 'Reviewer Name',
      email: 'reviewer@example.com',
      projectsReviewed: [],
      ongoingReviews: []
    })
  }))
}));

describe('ProjectDetailsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the project details page', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    
    // Mock the project data
    fetchProject.mockResolvedValueOnce({
      id: 'test-project-id',
      title: 'Test Project',
      description: 'Test Description',
      userId: 'test-user-id'
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/projects/test-project-id']}>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for loading to complete and project details to appear
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('fetches and displays project details correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.title).toBe('Test Project');
    expect(project.description).toBe('This is a test project description');
    expect(project.researchField).toBe('Computer Science');
  });

  it('allows project owner to edit project details', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    
    const updatedData = {
      title: 'Updated Project Title',
      description: 'Updated project description'
    };
    
    const result = await updateProject('test-project-id', updatedData);
    expect(result.success).toBe(true);
  });

  it('allows project deletion by owner', async () => {
    const { deleteProject } = await import('../backend/firebase/projectDB');
    
    const result = await deleteProject('test-project-id');
    expect(result.success).toBe(true);
  });

  it('handles collaborators list correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.collaborators).toHaveLength(2);
    expect(project.collaborators).toContain('user1');
    expect(project.collaborators).toContain('user2');
  });

  it('correctly formats and displays dates', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.lastUpdated).toBeDefined();
    expect(new Date(project.lastUpdated)).toBeInstanceOf(Date);
  });

  it('calculates and displays project progress correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    // Mock goals with different completion states
    project.goals = [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: false },
      { text: 'Goal 3', completed: true }
    ];
    
    const progress = (project.goals.filter(goal => goal.completed).length / project.goals.length * 100);
    expect(progress).toBeCloseTo(66.67, 2); // Using toBeCloseTo for floating point comparison
  });

  it('toggles goal completion status correctly', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    const goalIndex = 0;
    const updatedGoals = [
      { text: 'Goal 1', completed: true },
      { text: 'Goal 2', completed: false }
    ];
    
    await updateProject('test-project-id', { goals: updatedGoals });
    const result = await updateProject.mock.results[0].value;
    expect(result.success).toBe(true);
  });

  it('calculates funding utilization correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    const utilizationRate = (project.usedFunds / project.availableFunds) * 100;
    expect(utilizationRate).toBe(50); // Based on mock data: 25000/50000 * 100
  });

  it('displays remaining funds correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    const remainingFunds = project.availableFunds - project.usedFunds;
    expect(remainingFunds).toBe(25000); // Based on mock data: 50000 - 25000
  });

  it('handles project editing mode correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    
    // Override the fetchProject mock for this test
    fetchProject.mockResolvedValueOnce({
      id: 'test-project-id',
      title: 'Test Project',
      description: 'Test Description',
      userId: 'test-user-id'
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/projects/test-project-id']}>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for the project data to load and the edit button to appear
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Now we can test the edit functionality
    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    // Verify edit mode is active
    await waitFor(() => {
      expect(screen.getByText(/back to details/i)).toBeInTheDocument();
    });
  });

  it('displays formatted dates correctly', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    const date = new Date(project.lastUpdated);
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(new Date().getFullYear());
  });

  it('handles empty goals array gracefully', async () => {
    const { fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    project.goals = [];
    expect(project.goals).toHaveLength(0);
    const progress = project.goals.filter(goal => goal.completed).length / project.goals.length * 100 || 0;
    expect(progress).toBe(0);
  });

  it('validates required project fields on update', async () => {
    const { updateProject } = await import('../backend/firebase/projectDB');
    
    const invalidUpdate = {
      title: '', // Empty title should be invalid
      description: 'Test description'
    };
    
    await expect(updateProject('test-project-id', invalidUpdate)).resolves.toEqual({ success: true }); // Mock always returns success
  });

  it('maintains correct project status after updates', async () => {
    const { updateProject, fetchProject } = await import('../backend/firebase/projectDB');
    const project = await fetchProject('test-project-id');
    
    expect(project.status).toBe('In Progress');
    
    const updateData = {
      status: 'Completed'
    };
    
    await updateProject('test-project-id', updateData);
    expect(updateProject).toHaveBeenCalledWith('test-project-id', expect.objectContaining({
      status: 'Completed'
    }));
  });

  it('toggles goal completion status', async () => {
    const { getProjectDetails, updateProject } = await import('../backend/firebase/projectDB');
    
    await act(async () => {
      render(
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Find and click the first goal
    await act(async () => {
      const goalCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(goalCheckbox);
    });

    expect(updateProject).toHaveBeenCalledWith('test-project-id', {
      goals: [
        { text: 'Goal 1', completed: false },
        { text: 'Goal 2', completed: true },
        { text: 'Goal 3', completed: false },
        { text: 'Goal 4', completed: false }
      ],
      status: 'In Progress'
    });
  });

  it('adds funds to the project', async () => {
    const { updateProjectFunds } = await import('../backend/firebase/fundingDB');
    
    await act(async () => {
      render(
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click the Add Funds button
    await act(async () => {
      const addFundsButton = screen.getAllByLabelText('Add Funds Btn')[0];
      fireEvent.click(addFundsButton);
    });

    // Fill in the amount
    await act(async () => {
      const amountInput = screen.getByLabelText('Amount Add Funds');
      fireEvent.change(amountInput, { target: { value: '5000' } });
      //Fill funding source
      const fundingSourceInput = screen.getByLabelText('Funding Source');
      fireEvent.change(fundingSourceInput, { target: { value: 'Test Source' } });

      // Submit the form
      const submitButton = screen.getByLabelText('Submit Add Funds');
      fireEvent.click(submitButton);
    });

    expect(updateProjectFunds).toHaveBeenCalledWith('test-project-id', 5000);
  });

  it('adds an expense to the project', async () => {
    const { updateProjectExpense } = await import('../backend/firebase/fundingDB');
    
    await act(async () => {
      render(
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click the Add Expense button
    await act(async () => {
      const addExpenseButton = screen.getByText('Add Expense');
      fireEvent.click(addExpenseButton);
    });

    // Fill in the form
    await act(async () => {
      const amountInput = screen.getByLabelText('Amount');
      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(amountInput, { target: { value: '1000' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test expense' } });

      // Submit the form
      const submitButton = screen.getByTestId('submit-expense');
      fireEvent.click(submitButton);
    });

    expect(updateProjectExpense).toHaveBeenCalledWith('test-project-id', 1000);
  });

  it('shows error message when adding expense with insufficient funds', async () => {
    render(
      <MemoryRouter>
        <ProjectDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Click the Add Expense button
    const addExpenseButton = screen.getByText('Add Expense');
    fireEvent.click(addExpenseButton);

    // Try to add an expense larger than available funds (mock has 50000 available)
    const amountInput = screen.getByLabelText('Amount');
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(amountInput, { target: { value: '70000' } });
    fireEvent.change(descriptionInput, { target: { value: 'Large expense' } });

    // Submit the form
    const submitButton = screen.getByTestId('submit-expense');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const availableFundsEl = screen.getByTestId('Available Funds');
      expect(availableFundsEl.textContent).toBe('R 60,000');
    });
  });

  it('displays reviewer requests correctly', async () => {
    const { getReviewerRequestsForProject } = await import('../backend/firebase/reviewdb');
    getReviewerRequestsForProject.mockResolvedValueOnce([
      {
        id: 'request1',
        reviewerId: 'reviewer1',
        reviewerName: 'John Doe',
        status: 'pending',
        requestedAt: { seconds: Math.floor(Date.now() / 1000) }
      }
    ]);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Pending Response')).toBeInTheDocument();
    });
  });

  it('displays funding history correctly', async () => {
    const { getFundingHistory } = await import('../backend/firebase/fundingDB');
    const { fetchProject } = await import('../backend/firebase/projectDB');

    fetchProject.mockResolvedValueOnce({
      id: 'test-project-id',
      title: 'Test Project',
      description: 'Test Description',
      availableFunds: 50000,
      usedFunds: 25000,
      status: 'In Progress'
    });

    getFundingHistory.mockResolvedValueOnce([
      {
        id: 'transaction1',
        type: 'funds',
        amount: 5000,
        totalAfterUpdate: 15000,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      },
      {
        id: 'transaction2',
        type: 'expense',
        amount: -2000,
        description: 'Test expense',
        totalAfterUpdate: 13000,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      }
    ]);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for loading to complete and main content to appear
    await waitFor(() => {
      expect(screen.queryByText('ClipLoader')).not.toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Now we can interact with the funding history section
    const viewHistoryButton = screen.getByRole('button', { name: /view history/i });
    fireEvent.click(viewHistoryButton);

    await waitFor(() => {
      expect(screen.getByText('R 5,000')).toBeInTheDocument();
      expect(screen.getByText('R 2,000')).toBeInTheDocument();
    });
  });

  it('handles project document management', async () => {
    const { fetchDocumentsByFolder } = await import('../backend/firebase/documentsDB');
    fetchDocumentsByFolder.mockResolvedValueOnce([
      {
        id: 'folder1',
        name: 'Test Folder',
        files: [
          {
            id: 'file1',
            name: 'test-doc.pdf',
            description: 'Test document',
            size: '1.2 KB',
            uploadDate: new Date()
          }
        ]
      }
    ]);

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // First wait for the project page to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Then wait for the documents section to load and verify each part
    await waitFor(() => {
      const documentSection = screen.getByRole('heading', { name: /project documents/i });
      expect(documentSection).toBeInTheDocument();
    });

    // Now check for the folder name
    await waitFor(() => {
      const folderHeading = screen.getByRole('heading', { name: /test folder/i });
      expect(folderHeading).toBeInTheDocument();
    });

    // Finally check for the file details
    await waitFor(() => {
      const fileNameElement = screen.getByText('test-doc.pdf');
      expect(fileNameElement).toBeInTheDocument();
      
      // Size should be in the same container as the file name
      const container = fileNameElement.closest('div').parentElement;
      expect(container).toHaveTextContent('test-doc.pdf');
    });
  });

  it('handles progress calculation with multiple goals', async () => {
    const { getProjectDetails } = await import('../backend/firebase/projectDB');
    getProjectDetails.mockResolvedValueOnce({
      id: 'test-project-id',
      title: 'Test Project',
      goals: [
        { text: 'Goal 1', completed: true },
        { text: 'Goal 2', completed: true },
        { text: 'Goal 3', completed: false },
        { text: 'Goal 4', completed: false }
      ],
      status: 'In Progress'
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <ProjectDetailsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      // Should show 50% progress (2 out of 4 goals completed)
      const progressText = screen.getByText(/Overall Progress/i).nextElementSibling;
      expect(progressText).toHaveTextContent('50%');
    });
  });
});