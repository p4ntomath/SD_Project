import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Make React available globally
globalThis.React = React;

// Mock modules that might be missing
vi.mock('../components/CreateProjectForm', () => ({
  default: () => React.createElement('div', { 'data-testid': 'create-project-form' }, 'Mock CreateProjectForm')
}));

vi.mock('../backend/firebase/projectDB', () => ({
  createProject: vi.fn().mockResolvedValue('new-project-id')
}));

vi.mock('../backend/firebase/authFirebase', () => ({
  resetPassword: vi.fn().mockImplementation((email) => {
    if (email === 'nonexistent@example.com') {
      return Promise.reject(new Error('No account found with this email.'));
    }
    return Promise.resolve();
  })
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));