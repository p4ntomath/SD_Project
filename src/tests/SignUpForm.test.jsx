import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SignUpForm from '../components/SignUpForm';
import AuthContext from '../context/AuthContext';

// Mock the necessary dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

// Mock the firebase auth module
const mockSignUp = vi.fn();
const mockGoogleSignIn = vi.fn();
const mockGetUserRole = vi.fn();

vi.mock('../backend/firebase/authFirebase', () => ({
  signUp: (...args) => mockSignUp(...args),
  googleSignIn: (...args) => mockGoogleSignIn(...args),
  getUserRole: (...args) => mockGetUserRole(...args)
}));

vi.mock('react-spinners', () => ({
  ClipLoader: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('SignUpForm Component', () => {
  const mockSetRole = vi.fn();
  const mockSetLoading = vi.fn();
  const mockNavigate = vi.fn();
  
  const renderWithAuth = (ui) => {
    return render(
      <AuthContext.Provider value={{
        setRole: mockSetRole,
        setLoading: mockSetLoading
      }}>
        {ui}
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockReset();
    mockGoogleSignIn.mockReset();
    mockGetUserRole.mockReset();
    mockSetRole.mockReset();
    mockSetLoading.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the signup form correctly', () => {
    renderWithAuth(<SignUpForm />);
    const heading = screen.getByLabelText("heading")
    expect(heading).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithAuth(<SignUpForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderWithAuth(<SignUpForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('shows validation error for weak password', async () => {
    renderWithAuth(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('handles successful email/password signup', async () => {
    const mockUser = { uid: 'test-user-id' };
    mockSignUp.mockResolvedValueOnce(mockUser);
    mockGetUserRole.mockResolvedValueOnce('researcher');

    renderWithAuth(<SignUpForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123!' }
    });
    
    // Select a role
    const roleSelect = screen.getByLabelText(/role/i);
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('John Doe', 'john@example.com', 'Password123!', 'researcher', {});
    });
  });

  it('handles signup errors correctly', async () => {
    mockSignUp.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

    renderWithAuth(<SignUpForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Password123!' }
    });
    
    // Select a role
    const roleSelect = screen.getByLabelText(/role/i);
    fireEvent.change(roleSelect, { target: { value: 'researcher' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Check that the error appears in the email field error message
    const emailError = await screen.findByText(/Email Already Exists:/i);
    expect(emailError).toHaveClass('text-red-600');
    expect(emailError.closest('section')).toContainElement(screen.getByLabelText(/email address/i));
  });

  it('handles successful Google sign in for new users', async () => {
    const mockUser = { uid: 'google-user-id' };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: true, user: mockUser });

    renderWithAuth(<SignUpForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
      // Should not call getUserRole for new users
      expect(mockGetUserRole).not.toHaveBeenCalled();
    });
  });

  it('handles Google sign in errors', async () => {
    mockGoogleSignIn.mockRejectedValueOnce(new Error('Google sign-in failed'));

    renderWithAuth(<SignUpForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(await screen.findByText('Google sign-up failed. Please try again.')).toBeInTheDocument();
  });
});