import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthContext from '../context/AuthContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('ProtectedRoute Component', () => {
  const MockChild = () => <div>Protected Content</div>;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when loading is true', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: null, loading: true }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockChild />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('main')).toHaveClass('flex', 'justify-center', 'items-center', 'h-screen', 'bg-gray-50');
    expect(screen.getByTestId('clip-loader')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: null, loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockChild />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to complete-profile when user exists but has no role', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: 'test-uid' }, role: null, loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockChild />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/complete-profile');
  });

  it('renders children when user is authenticated and has a role', () => {
    render(
      <AuthContext.Provider value={{ user: { uid: 'test-uid' }, role: 'researcher', loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <MockChild />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not redirect when on login page and loading', () => {
    render(
      <AuthContext.Provider value={{ user: null, role: null, loading: true }}>
        <MemoryRouter initialEntries={['/login']}>
          <ProtectedRoute>
            <MockChild />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});