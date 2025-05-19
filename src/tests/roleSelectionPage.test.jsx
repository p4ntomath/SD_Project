import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import RoleSelectionPage from '@/pages/RoleSelectionPage';
import AuthContext from '@/context/AuthContext';
import * as authFirebase from '@/backend/firebase/authFirebase';


// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  CACHE_SIZE_UNLIMITED: 'unlimited',
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn()
}));

vi.mock('../backend/firebase/firebaseConfig', () => ({
  db: {},
  auth: {}
}));
// Mock the `completeProfile` function
vi.mock('@/backend/firebase/authFirebase', () => ({
  completeProfile: vi.fn(),
}));


// Mock the child form component
vi.mock('@/components/RoleSelctionForm', () => ({
  default: ({ onSubmit }) => (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        fullName: 'John Doe',
        role: 'Researcher',
        institution: 'Test University',
        department: 'CS',
        fieldOfResearch: 'AI',
        tags: ['AI', 'ML','DS'],
        bio: 'Test bio'
      });
    }}>
      <button type="submit">Submit</button>
    </form>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { name: 'Fallback Name' } }),
  };
});

describe('RoleSelectionPage', () => {
  const defaultContext = {
    setRole: vi.fn(),
    role: '',
    setLoading: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  

  test('renders RoleSelectionForm when not loading', () => {
    render(
      <AuthContext.Provider value={defaultContext}>
        <RoleSelectionPage />
      </AuthContext.Provider>,
      { wrapper: MemoryRouter }
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('submits form and calls completeProfile with correct data', async () => {
    const mockedComplete = vi.spyOn(authFirebase, 'completeProfile').mockResolvedValue();
    const contextWithSetters = {
      ...defaultContext,
      setRole: vi.fn(),
      setLoading: vi.fn(),
    };

    render(
      <AuthContext.Provider value={contextWithSetters}>
        <RoleSelectionPage />
      </AuthContext.Provider>,
      { wrapper: MemoryRouter }
    );

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockedComplete).toHaveBeenCalledWith(
        'John Doe',
        'Researcher',
        expect.objectContaining({
          role: 'Researcher',
          fullName: 'John Doe',
        })
      );
    });

    expect(contextWithSetters.setRole).toHaveBeenCalledWith('Researcher');
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  test('navigates to /home if role already set', () => {
    const contextWithRole = {
      ...defaultContext,
      role: 'Admin',
    };

    render(
      <AuthContext.Provider value={contextWithRole}>
        <RoleSelectionPage />
      </AuthContext.Provider>,
      { wrapper: MemoryRouter }
    );
    console.log(authFirebase.completeProfile.mock.calls);
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });
});
