import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  
  // Default context value
  const defaultContextValue = {
    setRole: mockSetRole,
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

    const nameInput = screen.getByLabelText(/name/i);
    const roleSelect = screen.getByLabelText(/your role/i);
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalledWith('John Doe', 'researcher');
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
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
});