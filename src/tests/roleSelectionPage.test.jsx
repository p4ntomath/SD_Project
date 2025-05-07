import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import RoleSelectionPage from '../pages/roleSelectionPage';
import AuthContext from '../context/AuthContext';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock the ClipLoader component
vi.mock('react-spinners', () => ({
  ClipLoader: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock the firebase auth functions
vi.mock('../backend/firebase/authFirebase', () => ({
  completeProfile: vi.fn(() => Promise.resolve())
}));

// Import after mocks
import { completeProfile } from '../backend/firebase/authFirebase';

describe('RoleSelectionPage', () => {
  const mockSetRole = vi.fn();
  const mockSetLoading = vi.fn();
  
  // Default context value
  const defaultContextValue = {
    setRole: mockSetRole,
    setLoading: mockSetLoading,
    role: null
  };

  // Helper function to render with context
  const renderWithContext = (contextValue = defaultContextValue) => {
    return render(
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter>
          <RoleSelectionPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the role selection form when not loading', () => {
    renderWithContext();

    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });


  it('handles form submission successfully', async () => {
    renderWithContext();

    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalledWith(
        'John Doe', 
        'researcher',
        expect.objectContaining({
          fullName: 'John Doe',
          role: 'researcher'
        })
      );
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('navigates to home if role is already set', () => {
    renderWithContext({
      ...defaultContextValue,
      role: 'researcher'
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('handles profile completion error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    completeProfile.mockRejectedValueOnce(new Error('Profile completion failed'));
    
    renderWithContext();

    const nameInput = screen.getByLabelText(/name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error completing profile:',
        'Profile completion failed'
      );
    });

    consoleError.mockRestore();
  });

  it('shows loading spinner when loading state is true', async () => {
    // Mock completeProfile to delay resolution
    completeProfile.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    renderWithContext();

    const nameInput = screen.getByLabelText(/name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    
    fireEvent.click(submitButton);

    expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles reviewer form submission with expertise and department', async () => {
    renderWithContext();

    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    
    // Fill in initial fields
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });
    fireEvent.change(roleSelect, { target: { value: 'reviewer' } });

    // Additional reviewer fields should appear
    const expertiseInput = screen.getByLabelText(/area of expertise/i);
    const departmentInput = screen.getByLabelText(/department/i);
    
    fireEvent.change(expertiseInput, { target: { value: 'Computer Science' } });
    fireEvent.change(departmentInput, { target: { value: 'Engineering' } });
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalledWith(
        'John Smith', 
        'reviewer', 
        expect.objectContaining({
          fullName: 'John Smith',
          role: 'reviewer',
          expertise: 'Computer Science',
          department: 'Engineering'
        })
      );
      expect(mockSetRole).toHaveBeenCalledWith('reviewer');
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('validates reviewer specific fields', async () => {
    renderWithContext();

    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    
    // Fill in initial fields but leave reviewer fields empty
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });
    fireEvent.change(roleSelect, { target: { value: 'reviewer' } });
    
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    // Should show validation errors for reviewer fields
    expect(screen.getByText(/expertise is required for reviewers/i)).toBeInTheDocument();
    expect(screen.getByText(/department is required for reviewers/i)).toBeInTheDocument();
  });

  it('clears validation errors when fields are filled', async () => {
    renderWithContext();

    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    // Submit empty form first
    fireEvent.click(submitButton);
    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    
    // Fill the name field
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    // Error message should be gone
    expect(screen.queryByText(/full name is required/i)).not.toBeInTheDocument();
  });

  it('handles setLoading in context during form submission', async () => {
    const mockSetLoading = vi.fn();
    const contextWithLoading = {
      ...defaultContextValue,
      setLoading: mockSetLoading
    };

    renderWithContext(contextWithLoading);

    const nameInput = screen.getByLabelText(/full name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });
});