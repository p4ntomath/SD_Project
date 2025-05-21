import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyProfilePage from '../pages/MyProfilePage';
import { vi } from 'vitest';

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
