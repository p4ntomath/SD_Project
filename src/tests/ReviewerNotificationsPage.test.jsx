import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ReviewerNotificationsPage from '../pages/reviewer/ReviewerNotificationsPage.jsx';

// Stub firebaseConfig
vi.mock('../backend/firebase/firebaseConfig', () => ({ auth: { currentUser: { uid: 'user1' } }, db: {} }));
// Stub firebase auth
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ currentUser: { uid: 'user1' } })) }));
// Stub firestore onSnapshot to no-op
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  doc: vi.fn(),
  updateDoc: vi.fn()
}));
// Stub nav components
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({ __esModule: true, default: () => <nav data-testid="main-nav" /> }));
vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({ __esModule: true, default: () => <footer data-testid="mobile-nav" /> }));

describe('ReviewerNotificationsPage', () => {
  it('renders loading state with navs', () => {
    render(
      <MemoryRouter>
        <ReviewerNotificationsPage />
      </MemoryRouter>
    );
    // Should show loading message synchronously
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    // Nav components should render
    expect(screen.getByTestId('main-nav')).toBeInTheDocument();
  });
});