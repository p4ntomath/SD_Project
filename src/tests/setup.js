import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';
import { cleanup } from '@testing-library/react';

// Make React available globally
globalThis.React = React;

// Setup test environment
beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

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

// Mock Firebase modules consistently across all tests
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
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => 'mocked-timestamp'),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  increment: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn()
  })),
  deleteField: vi.fn(),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  CACHE_SIZE_UNLIMITED: 'unlimited',
  Timestamp: {
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000) })),
    fromDate: vi.fn(date => ({ seconds: Math.floor(date.getTime() / 1000) }))
  }
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));