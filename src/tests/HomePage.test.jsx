import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeAll } from "vitest";
import "@testing-library/jest-dom";
import AuthContext from "../context/AuthContext";
import HomePage from "../pages/HomePage";

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
  CACHE_SIZE_UNLIMITED: 'unlimited',
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({}))
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock the homepage components
vi.mock("../pages/ResearcherPages/ResearcherHome", () => ({
  default: () => <div>Mock ResearcherHome</div>,
}));

vi.mock("../pages/ReviewerHomePage", () => ({
  default: () => <div>Mock ReviewerHomePage</div>,
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
  ClipLoader: () => <div data-testid="loading-spinner">Loading...</div>
}));

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
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("displays null if no user, no role, and not loading", () => {
    const { container } = renderWithContext({ role: null, loading: false, user: null });
    expect(container.firstChild).toBeNull();
  });

  it("navigates to /complete-profile if user exists but role is null", () => {
    renderWithContext({ role: null, loading: false, user: { uid: "3" } });
    expect(mockNavigate).toHaveBeenCalledWith("/complete-profile");
  });

  it("renders ResearcherHome for researcher role", () => {
    renderWithContext({ role: "researcher", loading: false, user: { uid: "1" } });
    expect(screen.getByText("Mock ResearcherHome")).toBeInTheDocument();
  });

  

  it("redirects to complete-profile if no role", () => {
    renderWithContext({ role: null, loading: false, user: { uid: "3" } });
    expect(mockNavigate).toHaveBeenCalledWith('/complete-profile');
  });
});
