import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyProfilePage from '../pages/MyProfilePage';
import { vi } from 'vitest';

// Suppress console warnings for controlled/uncontrolled input warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('changing a controlled input to be uncontrolled') ||
      args[0].includes('A component is changing a controlled input')
    )) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('changing a controlled input')
    )) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: '123' });
        return () => { }; // <-- mock unsubscribe function
    }),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    initializeFirestore: vi.fn(() => ({})),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
    CACHE_SIZE_UNLIMITED: 'unlimited',
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({
            role: 'Researcher',
            fullName: 'Test User',
            bio: 'Testing',
            researchField: 'AI',
        }),
    })),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
}));

// Mock profile update function
vi.mock('../backend/firebase/viewprofile', () => ({
    updateUserProfile: vi.fn(),
}));

// Mock UI components
vi.mock('../components/ResearcherComponents/Navigation/MainNav', () => ({
    default: () => <nav>MainNav</nav>,
}));

vi.mock('../components/ReviewerComponents/Navigation/ReviewerMainNav', () => ({
    default: () => <nav>ReviewerMainNav</nav>,
}));

vi.mock('../components/ResearcherComponents/Navigation/MobileBottomNav', () => ({
    default: () => <footer>MobileNav</footer>,
}));

vi.mock('../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav', () => ({
    default: () => <footer>ReviewerMobileNav</footer>,
}));

test('renders researcher navigation', async () => {
    render(<MyProfilePage />);
    expect(await screen.findByText(/MainNav/i)).toBeInTheDocument();
    expect(screen.getByText(/MobileNav/i)).toBeInTheDocument();
});

test('shows researcher form fields', async () => {
    render(<MyProfilePage />);
    expect(await screen.findByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Research Field/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Biography/i })).toBeInTheDocument();
});

test('allows typing into name field', async () => {
    render(<MyProfilePage />);
    const nameInput = await screen.findByLabelText(/Name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');
    expect(screen.getByDisplayValue(/Updated Name/i)).toBeInTheDocument();
});

test('shows Save Changes button', async () => {
    render(<MyProfilePage />);
    const button = await screen.findByRole('button', { name: /Save Changes/i });
    expect(button).toBeEnabled();
});
