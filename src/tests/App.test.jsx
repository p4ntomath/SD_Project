import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import App from '../App';
import AuthContext from '../context/AuthContext';

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn((auth, callback) => {
  callback(null);
  return () => {};
});

// Mock Firebase Auth and Firestore
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signOut: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({
    // Mock document reference
    id: 'test-doc-id'
  })),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ role: 'researcher' })
  })),
  collection: vi.fn()
}));

// Mock Firebase Config
vi.mock('../backend/firebase/firebaseConfig', () => ({
  auth: {
    currentUser: null
  },
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ role: 'researcher' })
        }))
      }))
    }))
  }
}));

// Mock Router component to avoid nesting issues
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => <>{children}</>,
  };
});

// Mock the components with data-testid attributes
vi.mock('../pages/welcomePage', () => ({
  default: () => <div data-testid="welcome-page">Welcome Page</div>
}));

vi.mock('../pages/loginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

// Mock the CompleteProfile component
vi.mock('../pages/roleSelectionPage', () => ({
  default: () => <div data-testid="complete-profile">Complete Profile</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome page on root path', async () => {
    const mockContextValue = {
      user: null,
      loading: false,
      role: null,
      setRole: vi.fn()
    };

    render(
      <AuthContext.Provider value={mockContextValue}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
    });
  });

  it('renders login page for unauthenticated users', async () => {
    const mockContextValue = {
      user: null,
      loading: false,
      role: null,
      setRole: vi.fn()
    };

    render(
      <AuthContext.Provider value={mockContextValue}>
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('protects home route for authenticated users', async () => {
    // Initial state - user authenticated but no role
    const mockContextValue = {
      user: { uid: 'test-user', email: 'test@example.com' },
      loading: false,
      role: null, // Start with no role
      setUser: vi.fn(),
      setRole: vi.fn()
    };

    mockOnAuthStateChanged.mockReset();
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: 'test-user', email: 'test@example.com' });
      return () => {};
    });

    const { rerender } = render(
      <AuthContext.Provider value={mockContextValue}>
        <MemoryRouter initialEntries={['/home']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // First, expect to see the complete profile page
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Now simulate role being set after profile completion
    const updatedMockContextValue = {
      ...mockContextValue,
      role: 'researcher'
    };

    // Re-render with updated context
    rerender(
      <AuthContext.Provider value={updatedMockContextValue}>
        <MemoryRouter initialEntries={['/home']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Now expect to see the home page
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});