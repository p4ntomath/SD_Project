import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
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

  it('handles form submission with valid data', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const roleSelect = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      role: 'researcher'
    });
  });

  it('shows validation errors for empty fields', () => {
    render(<RoleSelectionForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a role/i)).toBeInTheDocument();
  });
  
});