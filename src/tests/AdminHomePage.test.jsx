import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminHomePage from '../pages/AdminHomePage';
import { fetchAllUsers, fetchProjectsWithUsers, getAllFunding, createFunding } from '../backend/firebase/adminAccess';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { logOut } from '../backend/firebase/authFirebase';

// Suppress act() warnings
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (args[0]?.includes('inside a test was not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

// Mock Firebase modules
vi.mock('../backend/firebase/adminAccess');
vi.mock('../backend/firebase/documentsDB');
vi.mock('../backend/firebase/authFirebase');

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: 'div',
        article: 'article'
    },
    AnimatePresence: ({ children }) => children,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
    ...(await vi.importActual('react-router-dom')),
    useNavigate: () => mockNavigate,
}));

describe('AdminHomePage', () => {
    const mockUsers = [
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'Jane Smith' }
    ];

    const mockProjects = [
        { 
            id: 'proj1', 
            title: 'Research Project 1',
            userFullName: 'John Doe',
            status: 'In Progress',
            researchField: 'Computer Science'
        },
        {
            id: 'proj2',
            title: 'Research Project 2',
            userFullName: 'Jane Smith',
            status: 'Completed',
            researchField: 'Biology'
        }
    ];

    const mockFunding = [
        { id: 'fund1', name: 'Grant 1', expectedFunds: '10000' },
        { id: 'fund2', name: 'Grant 2', expectedFunds: '20000' }
    ];

    const mockDocuments = [
        { id: 'doc1', title: 'Document 1' },
        { id: 'doc2', title: 'Document 2' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        fetchAllUsers.mockResolvedValue(mockUsers);
        fetchProjectsWithUsers.mockResolvedValue(mockProjects);
        getAllFunding.mockResolvedValue(mockFunding);
        fetchAllDocuments.mockResolvedValue(mockDocuments);
    });

    it('renders loading state initially', () => {
        render(
            <BrowserRouter>
                <AdminHomePage />
            </BrowserRouter>
        );
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        // Should find 4 loading skeletons for stats
        const loadingElements = screen.getAllByTestId('loading-skeleton');
        expect(loadingElements).toHaveLength(4);
    });

    it('displays dashboard statistics after loading', async () => {
        render(
            <BrowserRouter>
                <AdminHomePage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('total-users-card')).toHaveTextContent('2');
            expect(screen.getByTestId('active-projects-card')).toHaveTextContent('2');
            expect(screen.getByTestId('funding-opportunities-card')).toHaveTextContent('2');
            expect(screen.getByTestId('total-documents-card')).toHaveTextContent('2');
        });
    });

    it('handles logout process correctly', async () => {
        render(
            <BrowserRouter>
                <AdminHomePage />
            </BrowserRouter>
        );

        // Click the initial logout button in header using aria-label
        const headerLogoutButton = screen.getByRole('button', { 'aria-label': 'Logout' });
        fireEvent.click(headerLogoutButton);

        // Verify modal appears with exact text
        expect(screen.getByText("Are you sure you want to log out? You'll need to sign in again to access your account.", 
            { exact: true }
        )).toBeInTheDocument();

        // Find and click the confirmation button using test ID
        const confirmLogoutButton = screen.getByTestId('confirm-logout');
        fireEvent.click(confirmLogoutButton);

        await waitFor(() => {
            expect(logOut).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('handles adding new funding opportunity', async () => {
        render(
            <BrowserRouter>
                <AdminHomePage />
            </BrowserRouter>
        );

        // Click on funding opportunities card to open modal
        const fundingCard = await screen.findByTestId('funding-opportunities-card');
        fireEvent.click(fundingCard);

        // Fill out the form
        const nameInput = screen.getByLabelText('Funding Name');
        const fundsInput = screen.getByLabelText('Expected Funds (R)');
        const linkInput = screen.getByLabelText('External Link');

        fireEvent.change(nameInput, { target: { value: 'New Grant' } });
        fireEvent.change(fundsInput, { target: { value: '30000' } });
        fireEvent.change(linkInput, { target: { value: 'https://example.com' } });

        // Submit the form
        const submitButton = screen.getByText('Add Funding');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(createFunding).toHaveBeenCalledWith({
                name: 'New Grant',
                expectedFunds: '30000',
                externalLink: 'https://example.com'
            });
        });
    });

    it('navigates to correct pages when clicking dashboard cards', async () => {
        render(
            <BrowserRouter>
                <AdminHomePage />
            </BrowserRouter>
        );

        // Wait for cards to load
        await waitFor(() => {
            const usersCard = screen.getByTestId('total-users-card');
            const projectsCard = screen.getByTestId('active-projects-card');
            const documentsCard = screen.getByTestId('total-documents-card');

            // Click each card and verify navigation
            fireEvent.click(usersCard);
            expect(mockNavigate).toHaveBeenCalledWith('/admin/users');

            fireEvent.click(projectsCard);
            expect(mockNavigate).toHaveBeenCalledWith('/admin/projects');

            fireEvent.click(documentsCard);
            expect(mockNavigate).toHaveBeenCalledWith('/admin/documents');
        });
    });

    it('handles errors in data fetching', async () => {
        // Mock console.error to prevent error from showing in test output
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock fetch failure
        fetchAllUsers.mockRejectedValueOnce(new Error('Failed to fetch users'));

        render(
            <BrowserRouter>
                <AdminHomePage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching admin stats:',
                expect.any(Error)
            );
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        mockConsoleError.mockRestore();
    });

});
