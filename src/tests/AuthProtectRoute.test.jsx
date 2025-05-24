import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, useNavigate } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthProtectRoute from "../components/AuthProtectRoute";
import AuthContext from "../context/AuthContext";
import "@testing-library/jest-dom";

// Mock Firebase dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  CACHE_SIZE_UNLIMITED: 'unlimited',
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AuthProtectRoute", () => {
  const mockContextValue = {
    user: null,
    role: null,
    loading: true, // Start with loading true
    setUser: vi.fn(),
    setRole: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  

  it("redirects to home when user is authenticated", async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    
    render(
      <AuthContext.Provider value={{ 
        ...mockContextValue, 
        user: mockUser, 
        role: 'researcher',
        loading: false 
      }}>
        <BrowserRouter>
          <AuthProtectRoute>
            <div data-testid="protected-content">Protected Content</div>
          </AuthProtectRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });

  it("shows loading state", () => {
    render(
      <AuthContext.Provider value={{ ...mockContextValue, loading: true }}>
        <BrowserRouter>
          <AuthProtectRoute>
            <div data-testid="protected-content">Protected Content</div>
          </AuthProtectRoute>
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});