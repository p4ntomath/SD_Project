import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/research field/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/goals/i)).toBeInTheDocument();
  });

  it('validates required fields including deadline', async () => {
    render(<CreateProjectForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/research field is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/deadline is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/please enter at least 2 goals/i)).toBeInTheDocument();
  });

  it('allows setting a deadline', () => {
    render(<CreateProjectForm {...mockProps} />);
    
    const deadlineInput = screen.getByLabelText(/deadline/i);
    fireEvent.change(deadlineInput, { target: { value: '2025-12-31' } });
    
    expect(deadlineInput.value).toBe('2025-12-31');
  });

  it('pre-fills form data in update mode', () => {
    const projectToUpdate = {
      title: 'Test Project',
      description: 'Test Description',
      researchField: 'Computer Science',
      deadline: '2025-12-31',
      goals: [
        { text: 'Goal 1', completed: false },
        { text: 'Goal 2', completed: true }
      ]
    };

    render(<CreateProjectForm {...mockProps} isUpdateMode={true} projectToUpdate={projectToUpdate} />);
    
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Project');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/research field/i)).toHaveValue('Computer Science');
    expect(screen.getByLabelText(/deadline/i)).toHaveValue('2025-12-31');
    expect(screen.getByText('Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Goal 2')).toBeInTheDocument();
  });
});