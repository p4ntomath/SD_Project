import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import RoleSelectionForm from '../components/RoleSelctionForm';

describe('RoleSelectionForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows role options', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveDisplayValue('Select your role');
    
    fireEvent.click(select);
    expect(screen.getByText('Researcher')).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
  });

  it('handles form submission with valid researcher data', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      fullName: 'John Doe',
      role: 'researcher',
      expertise: '',
      department: ''
    });
  });

  it('shows validation errors for empty fields', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a role/i)).toBeInTheDocument();
  });

  it('displays reviewer specific fields when reviewer role is selected', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'reviewer' } });

    expect(screen.getByLabelText(/area of expertise/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
  });

  it('handles form submission with valid reviewer data', async () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    await act(async () => {
      const nameInput = screen.getByLabelText(/full name/i);
      const roleSelect = screen.getByRole('combobox');
      
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      fireEvent.change(roleSelect, { target: { value: 'reviewer' } });
      
      const expertiseInput = screen.getByLabelText(/area of expertise/i);
      const departmentInput = screen.getByLabelText(/department/i);
      
      fireEvent.change(expertiseInput, { target: { value: 'Computer Science' } });
      fireEvent.change(departmentInput, { target: { value: 'Engineering' } });
    });
    
    await act(async () => {
      const submitButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(submitButton);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      fullName: 'Jane Smith',
      role: 'reviewer',
      expertise: 'Computer Science',
      department: 'Engineering'
    });
  });

  it('validates reviewer specific required fields', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByRole('combobox');
    
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(roleSelect, { target: { value: 'reviewer' } });
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/expertise is required for reviewers/i)).toBeInTheDocument();
    expect(screen.getByText(/department is required for reviewers/i)).toBeInTheDocument();
  });

  it('clears errors when fields are filled', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    expect(screen.queryByText(/full name is required/i)).not.toBeInTheDocument();
  });

  it('hides reviewer fields when switching back to researcher', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const roleSelect = screen.getByRole('combobox');
    
    // Switch to reviewer
    fireEvent.change(roleSelect, { target: { value: 'reviewer' } });
    expect(screen.getByLabelText(/area of expertise/i)).toBeInTheDocument();
    
    // Switch back to researcher
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    expect(screen.queryByLabelText(/area of expertise/i)).not.toBeInTheDocument();
  });
});