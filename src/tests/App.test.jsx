import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import App from '../App';
import AuthContext from '../context/AuthContext';

// Mock matchMedia for Framer Motion
const createMatchMedia = (matches) => {
  return (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
};

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback) {
    this.callback = callback;
  }
}

// Set up mocks before tests
beforeAll(() => {
  window.matchMedia = createMatchMedia(false);
  window.IntersectionObserver = MockIntersectionObserver;
});

// Mock Firebase Auth and Firestore
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null
  })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signOut: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn()
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
  },
  app: {}
}));

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  role: null,
  loading: false,
  setUser: vi.fn(),
  setRole: vi.fn(),
  setLoading: vi.fn()
};


describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome page by default', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <App />
      </AuthContext.Provider>
    );
    
    const text = screen.getByText(/Re:Search/);
    expect(text).toBeInTheDocument();
  });
});