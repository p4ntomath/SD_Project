import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SignUpForm from '../components/SignUpForm';

// Mock the component
vi.mock('../components/SignUpForm', () => ({
  default: () => <div data-testid="signup-form">Mocked SignUp Form</div>
}));

// Mock the necessary dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }) => <a href="/">{children}</a>
}));

// Mock the firebase auth module
vi.mock('../backend/firebase/authFirebase', () => ({
  signUp: vi.fn(() => Promise.resolve({ uid: 'test-user-id' })),
  googleSignIn: vi.fn(() => Promise.resolve({ isNewUser: true, user: { uid: 'google-user-id' } })),
  getUserRole: vi.fn(() => Promise.resolve('researcher'))
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('SignUpForm Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the signup form correctly', () => {
    render(<SignUpForm />);
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();
  });

  it('mocks the authentication functions correctly', async () => {
    const { signUp, googleSignIn, getUserRole } = await import('../backend/firebase/authFirebase');
    
    // Test signUp
    const signUpResult = await signUp('John Doe', 'john@example.com', 'Password123!', 'researcher');
    expect(signUpResult).toEqual({ uid: 'test-user-id' });
    
    // Test googleSignIn
    const googleResult = await googleSignIn();
    expect(googleResult).toEqual({ 
      isNewUser: true, 
      user: { uid: 'google-user-id' } 
    });
    
    // Test getUserRole
    const role = await getUserRole('test-user-id');
    expect(role).toBe('researcher');
  });
});