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
    useNavigate: () => mockNavigate
  };
});

// Mock Firebase Firestore
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
  CACHE_SIZE_UNLIMITED: 'unlimited'
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to login when user is not authenticated', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: null, loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to complete-profile when user has no role', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: 'test-uid' }, role: null, loading: false }}>
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

  it('renders children when user is authenticated and has role', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: 'test-uid' }, role: 'researcher', loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: null, loading: true }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('handles role-specific routes correctly', () => {
    // First test with incorrect role
    render(
      <AuthContext.Provider value={{ user: { uid: 'test-uid' }, role: 'reviewer', loading: false }}>
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['researcher']}>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify navigation happened
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/home');

    cleanup();
    mockNavigate.mockClear();

    // Now test with correct role
    render(
      <AuthContext.Provider value={{ user: { uid: 'test-uid' }, role: 'researcher', loading: false }}>
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['researcher']}>
            <MockComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});