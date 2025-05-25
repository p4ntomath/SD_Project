import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthContext from '../context/AuthContext';

// Mock components
const MockComponent = () => <div data-testid="protected-content">Protected Content</div>;

// Mock navigation
const mockNavigate = vi.fn();

// Mock router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' })
  };
});

// Mock Firebase Firestore with all required exports
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  CACHE_SIZE_UNLIMITED: 'unlimited',
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({}))
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to login when no user', () => {
    render(
      <AuthContext.Provider value={{ user: null, loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to complete-profile when no role', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: '123' }, role: null, loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/complete-profile', { 
      state: { from: '/' }
    });
  });

  it('shows loading spinner when loading', () => {
    render(
      <AuthContext.Provider value={{ user: null, loading: true }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('clip-loader')).toBeInTheDocument();
  });

  it('renders children when authorized', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: '123' }, role: 'researcher', loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects when role not allowed', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: '123' }, role: 'researcher', loading: false }}>
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['admin']}>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });
});