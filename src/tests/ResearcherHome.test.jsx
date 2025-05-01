import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ResearcherHome from '../pages/ResearcherPages/ResearcherHome';
import { formatDate, formatFirebaseDate } from '../utils/dateUtils';
import CreateProjectForm from '../components/CreateProjectForm';
import { auth } from '../backend/firebase/firebaseConfig';
import { fetchProjects } from '../backend/firebase/projectDB';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock firebase auth
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      callback({ uid: 'test-user-id' });
      return vi.fn(); // unsubscribe mock
    }),
  },
}));

// Mock projectDB
vi.mock('../backend/firebase/projectDB', () => ({
  fetchProjects: vi.fn(),
}));

describe('Date formatting functions', () => {
  describe('formatDate', () => {
    it('should return "Not specified" for null or undefined input', () => {
      expect(formatDate(null)).toBe('Not specified');
      expect(formatDate(undefined)).toBe('Not specified');
    });

    it('should format date string correctly', () => {
      const testDate = '2025-04-22';
      const formattedDate = formatDate(testDate);
      expect(formattedDate).toContain('2025');
      expect(formattedDate).toMatch(/Apr|April/);
      expect(formattedDate).toContain('22');
    });
  });

  describe('formatFirebaseDate', () => {
    it('should return empty string for invalid input', () => {
      expect(formatFirebaseDate(null)).toBe('');
      expect(formatFirebaseDate(undefined)).toBe('');
      expect(formatFirebaseDate('not an object')).toBe('');
    });

    it('should format Firebase timestamp correctly', () => {
      const timestamp = {
        seconds: 1714089600, // April 26, 2024
        nanoseconds: 0
      };
      const formattedDate = formatFirebaseDate(timestamp);
      expect(formattedDate).toBe('April 26, 2024');
    });
  });
});

describe('ResearcherHome', () => {
  const mockProjects = [
    {
      id: '1',
      title: 'Test Project 1',
      description: 'Test Description 1',
      researchField: 'Computer Science',
      goals: [{ text: 'Goal 1', completed: false }],
      availableFunds: 10000,
      usedFunds: 5000,
      status: 'In Progress',
      collaborators: ['user1', 'user2']
    },
    {
      id: '2',
      title: 'Test Project 2',
      description: 'Test Description 2',
      researchField: 'Biology',
      goals: [{ text: 'Goal 1', completed: true }],
      availableFunds: 20000,
      usedFunds: 15000,
      status: 'Completed',
      collaborators: ['user1', 'user3']
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fetchProjects.mockResolvedValue(mockProjects);
  });

  it('renders the researcher dashboard with correct headings', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Projects Overview')).toBeInTheDocument();
      expect(screen.getByText('Funding Summary')).toBeInTheDocument();
      expect(screen.getByText('Progress Overview')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Team Overview')).toBeInTheDocument();
    });
  });

  it('displays correct project statistics', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      // Check total projects
      const totalProjects = screen.getByTestId('total-projects');
      expect(totalProjects).toHaveTextContent('2');
      expect(totalProjects.nextElementSibling).toHaveTextContent('Total Projects');

      // Check active projects
      const activeProjects = screen.getByTestId('active-projects');
      expect(activeProjects).toHaveTextContent('1');
      expect(activeProjects.nextElementSibling).toHaveTextContent('Active');

      // Check completed projects
      const completedProjects = screen.getByTestId('completed-projects');
      expect(completedProjects).toHaveTextContent('1');
      expect(completedProjects.nextElementSibling).toHaveTextContent('Completed');
    });
  });

  it('displays correct funding information', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('R 30,000')).toBeInTheDocument(); // Total available funds
      expect(screen.getByText('R 20,000')).toBeInTheDocument(); // Total used funds
    });
  });

  it('calculates and displays correct progress percentage', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument(); // Overall progress (1 completed goal out of 2)
    });
  });

  it('displays correct number of collaborators', async () => {
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total unique collaborators
      expect(screen.getByText('Across 2 projects')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', async () => {
    fetchProjects.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<ResearcherHome />, { wrapper: MemoryRouter });
    
    expect(screen.getByTestId('researcher-home')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays empty state messages when no projects exist', async () => {
    fetchProjects.mockResolvedValueOnce([]);
    render(<ResearcherHome />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('No funding to track')).toBeInTheDocument();
      expect(screen.getByText('No projects to track')).toBeInTheDocument();
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(screen.getByText('No team members yet')).toBeInTheDocument();
    });
  });
});

describe('CreateProjectForm', () => {
    it('submits valid form and calls onCreate with correct data', async () => {
      const mockOnCreate = vi.fn();
      
      render(
        <CreateProjectForm 
          loading={false}
          onCreate={mockOnCreate}
          onCancel={() => {}}
          isUpdateMode={false}
        />
      );
  
      // Fill out the form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Research Project' }
      });
  
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'This is a valid research project description.' }
      });
  
      fireEvent.change(screen.getByLabelText(/research field/i), {
        target: { value: 'Physics' }
      });
  
      fireEvent.change(screen.getByLabelText(/duration/i), {
        target: { value: '6 months' }
      });
  
      const goalInput = screen.getByLabelText(/Goals\* \(Press Enter or comma to add\)/i);

  
      fireEvent.change(goalInput, { target: { value: 'Goal 1' } });
      fireEvent.keyDown(goalInput, { key: 'Enter', code: 'Enter' });
  
      fireEvent.change(goalInput, { target: { value: 'Goal 2' } });
      fireEvent.keyDown(goalInput, { key: 'Enter', code: 'Enter' });
  
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create project/i }));
  
      // Expect onCreate to have been called once
      expect(mockOnCreate).toHaveBeenCalledTimes(1);
  
      const createdProject = mockOnCreate.mock.calls[0][0];
      expect(createdProject.title).toBe('Test Research Project');
      expect(createdProject.goals).toHaveLength(2);
      expect(createdProject.researchField).toBe('Physics');
      expect(createdProject.duration).toBe('6 months');
    });
  });