import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LoginForm from '../components/LogInForm';
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

// Mock ClipLoader component
vi.mock('react-spinners', () => ({
  ClipLoader: ({ 'data-testid': testId }) => <div data-testid={testId || 'loading-spinner'}>Loading...</div>
}));

// Mock Google logo
vi.mock('../assets/googleLogo.png', () => ({
  default: 'mock-google-logo'
}));

// Mock Firebase auth functions
const mockSignIn = vi.fn();
const mockGoogleSignIn = vi.fn();
const mockGetUserRole = vi.fn();

vi.mock('../backend/firebase/authFirebase', () => ({
  signIn: (...args) => mockSignIn(...args),
  googleSignIn: (...args) => mockGoogleSignIn(...args),
  getUserRole: (...args) => mockGetUserRole(...args)
}));

describe('LoginForm Component', () => {
  const mockSetRole = vi.fn();
  const mockSetLoading = vi.fn();
  
  const renderLoginForm = () => {
    return render(
      <AuthContext.Provider value={{
        setRole: mockSetRole,
        setLoading: mockSetLoading
      }}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form with all elements', () => {
    renderLoginForm();
    
    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    renderLoginForm();
    
    fireEvent.click(screen.getByRole('button', { name: /login$/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login$/i }));

    expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser = { uid: 'test-uid' };
    mockSignIn.mockResolvedValueOnce(mockUser);
    mockGetUserRole.mockResolvedValueOnce('researcher');

    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login$/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'Password123!');
    });
    
    await waitFor(() => {
      expect(mockGetUserRole).toHaveBeenCalledWith(mockUser.uid);
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
    });
  });

  it('handles user not found error', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/user-not-found' });

    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'nonexistent@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login$/i }));

    expect(await screen.findByText(/no account found with this email/i)).toBeInTheDocument();
  });

  it('handles Google sign in for existing user', async () => {
    const mockUser = { uid: 'google-uid' };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: false, user: mockUser });
    mockGetUserRole.mockResolvedValueOnce('researcher');

    renderLoginForm();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetUserRole).toHaveBeenCalledWith(mockUser.uid);
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('handles Google sign in for new user', async () => {
    const mockUser = { uid: 'google-uid' };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: true, user: mockUser });

    renderLoginForm();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/complete-profile');
    });
  });

  it('handles Google sign in popup closed', async () => {
    mockGoogleSignIn.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });

    renderLoginForm();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(await screen.findByText(/google sign-in was closed/i)).toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockGetUserRole.mockResolvedValueOnce('researcher');

    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login$/i }));

    expect(screen.getByTestId('login-spinner')).toBeInTheDocument();
  });

  it('redirects admin user to admin page', async () => {
    const mockUser = { uid: 'admin-uid' };
    mockSignIn.mockResolvedValueOnce(mockUser);
    mockGetUserRole.mockResolvedValueOnce('admin');

    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'AdminPass123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login$/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('admin@example.com', 'AdminPass123!');
    });

    await waitFor(() => {
      expect(mockGetUserRole).toHaveBeenCalledWith(mockUser.uid);
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
    });
  });
});