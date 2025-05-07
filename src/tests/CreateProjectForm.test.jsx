import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateProjectForm from '../components/CreateProjectForm';

describe('CreateProjectForm Component', () => {
  const mockProps = {
    loading: false,
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onCancel: vi.fn(),
    isUpdateMode: false
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders all required form fields', () => {
    render(<CreateProjectForm {...mockProps} />);
    
    expect(screen.getByLabelText(/^Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Research Field/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Deadline/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Goals/)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(<CreateProjectForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/research field is required/i)).toBeInTheDocument();
      expect(screen.getByText(/deadline is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter at least 2 goals/i)).toBeInTheDocument();
    });
  });

  it('validates field content requirements', async () => {
    render(<CreateProjectForm {...mockProps} />);
    
    // Fill in invalid data
    fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/^description/i), { target: { value: 'too short' } });
    fireEvent.change(screen.getByLabelText(/^research field/i), { target: { value: 'a' } });
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/research field must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('validates goal requirements', async () => {
    render(<CreateProjectForm {...mockProps} />);
    
    // Add just one goal
    const goalInput = screen.getByRole('textbox', { name: /^Goals/i });
    fireEvent.change(goalInput, { target: { value: 'First goal' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter at least 2 goals/i)).toBeInTheDocument();
    });

    // Add second goal
    fireEvent.change(goalInput, { target: { value: 'Second goal' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });

    // Submit again
    fireEvent.click(submitButton);

    // Goals error should be gone
    await waitFor(() => {
      expect(screen.queryByText(/please enter at least 2 goals/i)).not.toBeInTheDocument();
    });
  });

  it('validates deadline is not in the past', async () => {
    render(<CreateProjectForm {...mockProps} />);
    
    // Fill in required fields to trigger full validation
    fireEvent.change(screen.getByLabelText(/^title/i), { 
      target: { value: 'Valid Project Title' } 
    });
    fireEvent.change(screen.getByLabelText(/^description/i), { 
      target: { value: 'This is a valid description that is longer than twenty characters.' } 
    });
    fireEvent.change(screen.getByLabelText(/^research field/i), { 
      target: { value: 'Computer Science' } 
    });
    
    // Add two goals
    const goalInput = screen.getByRole('textbox', { name: /^Goals/i });
    fireEvent.change(goalInput, { target: { value: 'First goal' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    fireEvent.change(goalInput, { target: { value: 'Second goal' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    
    // Set a past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateString = pastDate.toISOString().split('T')[0];
    
    const deadlineInput = screen.getByLabelText(/^deadline/i);
    fireEvent.change(deadlineInput, { target: { value: pastDateString } });
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Deadline*/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<CreateProjectForm {...mockProps} />);
    
    // Fill in valid data
    fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'Valid Project Title' } });
    fireEvent.change(screen.getByLabelText(/^description/i), { target: { value: 'This is a valid description that is longer than twenty characters.' } });
    fireEvent.change(screen.getByLabelText(/^research field/i), { target: { value: 'Computer Science' } });
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(screen.getByLabelText(/^deadline/i), { target: { value: futureDate.toISOString().split('T')[0] } });
    
    // Add two goals
    const goalInput = screen.getByRole('textbox', { name: /^Goals/i });
    fireEvent.change(goalInput, { target: { value: 'First goal' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    fireEvent.change(goalInput, { target: { value: 'Second goal' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onCreate).toHaveBeenCalled();
    });
  });

  it('pre-fills form data in update mode', () => {
    const projectToUpdate = {
      title: 'Test Project',
      description: 'Test Description that is more than twenty characters long',
      researchField: 'Computer Science',
      deadline: new Date('2025-12-31'),
      goals: [
        { text: 'Goal 1', completed: false },
        { text: 'Goal 2', completed: true }
      ]
    };

    render(<CreateProjectForm {...mockProps} isUpdateMode={true} projectToUpdate={projectToUpdate} />);
    
    expect(screen.getByLabelText(/^title/i)).toHaveValue('Test Project');
    expect(screen.getByLabelText(/^description/i)).toHaveValue('Test Description that is more than twenty characters long');
    expect(screen.getByLabelText(/^research field/i)).toHaveValue('Computer Science');
    expect(screen.getByLabelText(/^deadline/i)).toHaveValue('2025-12-31');
    expect(screen.getByText('Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Goal 2')).toBeInTheDocument();
  });
});