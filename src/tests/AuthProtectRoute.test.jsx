import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import AuthProtectRoute from "../components/AuthProtectRoute";
import AuthContext from "../context/AuthContext";
import "@testing-library/jest-dom";

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

describe("AuthProtectRoute", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("renders children when user is null and loading is false", () => {
    const MockComponent = () => <div>Protected Content</div>;
    render(
      <AuthContext.Provider value={{ user: null, role: null }}>
        <MemoryRouter>
          <AuthProtectRoute>
            <MockComponent />
          </AuthProtectRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("shows loading spinner when in loading state", () => {
    const MockComponent = () => <div>Protected Content</div>;
    render(
      <AuthContext.Provider value={{ user: null, role: null, loading: true }}>
        <MemoryRouter>
          <AuthProtectRoute>
            <MockComponent />
          </AuthProtectRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("navigates to complete-profile when user exists but has no role", () => {
    const MockComponent = () => <div>Protected Content</div>;
    render(
      <AuthContext.Provider value={{ user: { id: '123' }, role: null }}>
        <MemoryRouter>
          <AuthProtectRoute>
            <MockComponent />
          </AuthProtectRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/complete-profile", { replace: true });
  });

  it("navigates to home when user exists and has a role", () => {
    const MockComponent = () => <div>Protected Content</div>;
    render(
      <AuthContext.Provider value={{ user: { id: '123' }, role: 'researcher' }}>
        <MemoryRouter>
          <AuthProtectRoute>
            <MockComponent />
          </AuthProtectRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });
});