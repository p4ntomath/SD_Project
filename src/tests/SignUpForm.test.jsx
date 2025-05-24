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
  CACHE_SIZE_UNLIMITED: 'unlimited',
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({}))
}));

// Mock the firebase auth module exports
const mockSignUp = vi.fn();
const mockGoogleSignIn = vi.fn();

vi.mock('../backend/firebase/authFirebase', () => ({
  signUp: (...args) => mockSignUp(...args),
  googleSignIn: (...args) => mockGoogleSignIn(...args)
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('SignUpForm Component', () => {
  const mockSetRole = vi.fn();
  const mockSetLoading = vi.fn();
  
  const renderSignUpForm = () => {
    return render(
      <AuthContext.Provider value={{
        setRole: mockSetRole,
        setLoading: mockSetLoading
      }}>
        <SignUpForm />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    renderSignUpForm();
    
    expect(screen.getByLabelText("heading")).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderSignUpForm();
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderSignUpForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('validates password requirements', async () => {
    renderSignUpForm();
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'weak' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('validates password match', async () => {
    renderSignUpForm();
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'DifferentPass123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument();
  });

  it('handles successful signup', async () => {
    const mockUser = { 
      uid: 'test-uid',
      email: 'test@example.com'
    };
    mockSignUp.mockResolvedValueOnce(mockUser);

    renderSignUpForm();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'StrongPass123!'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/complete-profile', {
        state: {
          userId: mockUser.uid,
          email: mockUser.email,
          name: 'Test User',
          isEmailSignup: true
        }
      });
    });
  });

  it('handles email already exists error', async () => {
    mockSignUp.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

    renderSignUpForm();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'existing@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });

  it('handles successful Google sign in for new user', async () => {
    const mockUser = {
      uid: 'google-uid',
      email: 'google@example.com',
      displayName: 'Google User'
    };
    mockGoogleSignIn.mockResolvedValueOnce({ isNewUser: true, user: mockUser });

    renderSignUpForm();
    
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

  it('handles Google sign in errors', async () => {
    mockGoogleSignIn.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });

    renderSignUpForm();
    
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(await screen.findByText(/google sign-in was closed/i)).toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderSignUpForm();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'StrongPass123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});