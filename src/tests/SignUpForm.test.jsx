import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SignUpForm from '../components/SignUpForm';
import AuthContext from '../context/AuthContext';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

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

  it('renders all form fields correctly', () => {
    renderWithAuth(<SignUpForm />);
    const heading = screen.getByLabelText("heading");
    expect(heading).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithAuth(<SignUpForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
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

  it('shows validation error for non-matching passwords', async () => {
    renderWithAuth(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument();
  });

  it('handles successful email/password signup', async () => {
    const mockUser = { uid: 'test-user-id' };
    mockSignUp.mockResolvedValueOnce(mockUser);

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
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'John Doe', 
        'john@example.com', 
        'Password123!'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/complete-profile', {
        state: {
          userId: mockUser.uid,
          email: mockUser.email,
          name: 'John Doe',
          isEmailSignup: true
        }
      });
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
      target: { value: 'existing@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Check that the error appears
    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });

  it('handles successful Google sign in', async () => {
    const mockUser = { uid: 'google-user-id', email: 'google@example.com', displayName: 'Google User' };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: true, user: mockUser });

    renderWithAuth(<SignUpForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/complete-profile', {
        state: {
          userId: mockUser.uid,
          email: mockUser.email,
          name: mockUser.displayName,
          isGoogleSignup: true
        }
      });
    });
  });

  it('shows loading state during form submission', async () => {
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

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
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  describe('Google Sign In Error Handling', () => {
    it('handles popup closed by user error', async () => {
      mockGoogleSignIn.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
      
      renderWithAuth(<SignUpForm />);
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      
      expect(await screen.findByText(/google sign-in was closed before completion/i)).toBeInTheDocument();
    });

    it('handles popup blocked error', async () => {
      mockGoogleSignIn.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
      
      renderWithAuth(<SignUpForm />);
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      
      expect(await screen.findByText(/google sign-in popup was blocked/i)).toBeInTheDocument();
    });

    it('handles invalid credential error', async () => {
      mockGoogleSignIn.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
      
      renderWithAuth(<SignUpForm />);
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      
      expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});