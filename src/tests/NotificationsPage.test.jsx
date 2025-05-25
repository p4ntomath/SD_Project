import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as authModule from 'firebase/auth';
import * as firestoreModule from 'firebase/firestore';

// Spy on react-router useNavigate by mocking react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

// Mock MainNav and MobileBottomNav
vi.mock('../components/ResearcherComponents/Navigation/MainNav', () => ({ default: () => <div data-testid="main-nav" /> }));
vi.mock('../components/ResearcherComponents/Navigation/MobileBottomNav', () => ({ default: () => <div data-testid="bottom-nav" /> }));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({ getAuth: vi.fn() }));
// Partially mock firebase/firestore, preserving other methods like initializeFirestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
  };
});

// Mock notificationsUtil to avoid real firebaseConfig import
vi.mock('..//backend/firebase/notificationsUtil', () => ({ notify: vi.fn() }));

import NotificationsPage from '../pages/NotificationsPage';

describe('NotificationsPage', () => {
  const dbMock = {};
  const mockDocRef = { id: '1' };

  beforeEach(() => {
    // Auth currentUser
    authModule.getAuth.mockReturnValue({ currentUser: { uid: 'user1' } });
    // Firestore
    firestoreModule.getFirestore.mockReturnValue(dbMock);
    firestoreModule.doc.mockReturnValue(mockDocRef);
    firestoreModule.updateDoc.mockClear();
    firestoreModule.onSnapshot.mockClear();
    mockNavigate.mockClear();
  });

  it('renders empty state when no notifications', async () => {
    // onSnapshot returns empty list and an unsubscribe function
    firestoreModule.onSnapshot.mockImplementation((_, cb) => { cb({ docs: [] }); return () => {}; });

    render(<NotificationsPage />);

    // Should show heading
    expect(screen.getByText(/Your Notifications/i)).toBeInTheDocument();
    // Empty graphic state
    expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
    expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument();
  });

  it('renders notifications list and navigates on click', async () => {
    const timestamp = new Date('2025-05-25T12:00:00').getTime();
    const notification = { id: '1', data: () => ({ timestamp, type: 'Test Type', message: 'Hello World', readStatus: false, projectId: 'proj1' }) };
    firestoreModule.onSnapshot.mockImplementation((_, cb) => { cb({ docs: [notification] }); return () => {}; });

    render(<NotificationsPage />);

    // Should render the item
    expect(await screen.findByText('Test Type')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark as read/i })).toBeInTheDocument();

    // Clicking the notification navigates
    const item = screen.getByText('Test Type').closest('section');
    fireEvent.click(item);
    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj1');
  });

  it('calls updateDoc when marking as read', async () => {
    const timestamp = Date.now();
    const notification = { id: '1', data: () => ({ timestamp, type: 'Foo', message: 'Bar', readStatus: false, projectId: null }) };
    firestoreModule.onSnapshot.mockImplementation((_, cb) => { cb({ docs: [notification] }); return () => {}; });

    render(<NotificationsPage />);
    const button = await screen.findByRole('button', { name: /Mark as read/i });
    fireEvent.click(button);

    // Should call doc and updateDoc
    expect(firestoreModule.doc).toHaveBeenCalledWith(dbMock, 'notifications', '1');
    expect(firestoreModule.updateDoc).toHaveBeenCalledWith(mockDocRef, { readStatus: true });
  });
});