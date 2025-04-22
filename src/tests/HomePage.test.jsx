import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";

import "@testing-library/jest-dom";
import AuthContext from  "../context/AuthContext";
import { ClipLoader } from "react-spinners";

// Mocks
// Corrected Mocks
vi.mock("../ResearcherHomePage", () => ({
    default: () => <div>Mock ResearcherHomePage</div>, // 👈 was incorrectly set to Reviewer
  }));
  
  vi.mock("../ReviewerHomePage", () => ({
    default: () => <div>Mock ReviewerHomePage</div>,
  }));
  
  vi.mock("../ResearcherPages/ResearcherHome", () => ({
    default: () => <div>Mock ResearcherHome</div>,
  }));
  

import HomePage from "../pages/HomePage";
const mockNavigate = vi.fn();

    // Override useNavigate just for this test
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });

// Utility to render with AuthContext
const renderWithContext = (ctxValue) => {
  return render(
    <AuthContext.Provider value={ctxValue}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("HomePage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });


  it("renders loading spinner if loading is true", () => {
    renderWithContext({ role: null, loading: true, user: null });
  
    // Check if the loading container section is present
    const loadingSection = screen.getAllByLabelText("Loading");
    expect(loadingSection.length).toBeGreaterThanOrEqual(1);
  
    // Optionally, check the loader component exists
  });
  

  it("renders null if no user, no role, and not loading", () => {
    const { container } = renderWithContext({ role: null, loading: false, user: null });
    expect(container.firstChild).toBeNull();
  });

  it("navigates to /complete-profile if user exists but role is null", () => {

    renderWithContext({ role: null, loading: false, user: { uid: "3" } });

    expect(mockNavigate).toHaveBeenCalledWith("/complete-profile");
  });
});
