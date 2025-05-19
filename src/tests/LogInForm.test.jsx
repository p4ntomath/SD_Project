import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import LogInForm from '../components/LogInForm';
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

// Mock Firebase Auth and Firestore
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  CACHE_SIZE_UNLIMITED: 'unlimited'
}));

// Mock the firebase auth functions
const mockSignIn = vi.fn();
const mockGoogleSignIn = vi.fn();
const mockGetUserRole = vi.fn();

vi.mock('../backend/firebase/authFirebase', () => ({
  signIn: (...args) => mockSignIn(...args),
  googleSignIn: (...args) => mockGoogleSignIn(...args),
  getUserRole: (...args) => mockGetUserRole(...args)
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('LogInForm Component', () => {
  const mockSetRole = vi.fn();
  const mockSetLoading = vi.fn();
  
  const renderWithAuth = () => {
    return render(
      <AuthContext.Provider value={{
        setRole: mockSetRole,
        setLoading: mockSetLoading
      }}>
        <LogInForm />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockReset();
    mockGoogleSignIn.mockReset();
    mockGetUserRole.mockReset();
    mockSetRole.mockReset();
    mockSetLoading.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the login form correctly', () => {
    renderWithAuth();
    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithAuth();
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderWithAuth();
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('handles successful email/password login', async () => {
    const mockUser = { uid: 'test-user-id' };
    mockSignIn.mockResolvedValueOnce(mockUser);
    mockGetUserRole.mockResolvedValueOnce('researcher');

    renderWithAuth();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockGetUserRole).toHaveBeenCalledWith('test-user-id');
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
    });
  });

  it('handles login errors correctly', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/user-not-found' });

    renderWithAuth();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/no account found with this email. please sign up./i)).toBeInTheDocument();
  });

  it('handles successful Google sign in', async () => {
    const mockUser = { uid: 'google-user-id' };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: false, user: mockUser });
    mockGetUserRole.mockResolvedValueOnce('researcher');

    renderWithAuth();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
      expect(mockGetUserRole).toHaveBeenCalledWith('google-user-id');
      expect(mockSetRole).toHaveBeenCalledWith('researcher');
    });
  });

  it('redirects new Google users to complete profile', async () => {
    const mockUser = { uid: 'google-user-id' };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: true, user: mockUser });

    renderWithAuth();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/complete-profile');
    });
  });

  it('handles Google sign in errors', async () => {
    mockGoogleSignIn.mockRejectedValueOnce(new Error('Google sign-in failed'));

    renderWithAuth();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(await screen.findByText(/google sign-in failed/i)).toBeInTheDocument();
  });

});