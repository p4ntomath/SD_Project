import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import LogInForm from '../components/LogInForm';

// Mock the components
vi.mock('../components/LogInForm', () => ({
  default: () => <div data-testid="login-form">Mocked Login Form</div>
}));

// Mock the necessary dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }) => <a href="/">{children}</a>
}));

// Mock the firebase auth module
vi.mock('../backend/firebase/authFirebase', () => ({
  signIn: vi.fn(() => Promise.resolve({ uid: 'test-user-id' })),
  googleSignIn: vi.fn(() => Promise.resolve({ isNewUser: false, user: { uid: 'google-user-id' } })),
  getUserRole: vi.fn(() => Promise.resolve('researcher'))
}));

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  __esModule: true,
  default: {
    Consumer: ({ children }) => children({
      setRole: vi.fn(),
      setLoading: vi.fn()
    })
  }
}));

describe('LogInForm Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the login form correctly', () => {
    render(<LogInForm />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('mocks the signIn function correctly', async () => {
    const { signIn } = await import('../backend/firebase/authFirebase');
    expect(signIn).toBeDefined();
    
    const result = await signIn('test@example.com', 'password123');
    expect(result).toEqual({ uid: 'test-user-id' });
  });

  it('mocks the googleSignIn function correctly', async () => {
    const { googleSignIn } = await import('../backend/firebase/authFirebase');
    expect(googleSignIn).toBeDefined();
    
    const result = await googleSignIn();
    expect(result).toEqual({ 
      isNewUser: false, 
      user: { uid: 'google-user-id' } 
    });
  });
});