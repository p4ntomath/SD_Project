import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import AuthProtectRoute from "../components/AuthProtectRoute";
import AuthContext from "../context/AuthContext";
import { ClipLoader } from "react-spinners";
import "@testing-library/jest-dom";


describe("AuthProtectRoute", () => {
  it("renders children when user is null and loading is false", () => {
    const MockComponent = () => <div>Protected Content</div>;
    const mockUser = null;
    const mockRole = null;
    const mockLoading = false;

    render(
      <AuthContext.Provider value={{ user: mockUser, role: mockRole, loading: mockLoading }}>
        <MemoryRouter>
          <AuthProtectRoute>
            <MockComponent />
          </AuthProtectRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});