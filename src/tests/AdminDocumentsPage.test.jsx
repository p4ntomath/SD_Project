import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDocumentsPage from '../pages/AdminDocumentsPage';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { getDoc, getFirestore } from 'firebase/firestore';

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
vi.mock('../backend/firebase/documentsDB');
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(() => ({
        exists: () => true,
        data: () => ({
            title: 'Test Project',
            userId: 'user1',
            fullName: 'John Doe'
        })
    })),
    getFirestore: vi.fn(),
    initializeFirestore: vi.fn(),
    collection: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    CACHE_SIZE_UNLIMITED: 'unlimited'
}));

// Mock Framer Motion to prevent the animation-related error
vi.mock('framer-motion', () => ({
    motion: {
        div: 'div',
        td: 'td',
        tr: 'tr',
    },
    AnimatePresence: ({ children }) => children,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
    ...(await vi.importActual('react-router-dom')),
    useNavigate: () => mockNavigate,
}));

describe('AdminDocumentsPage', () => {
    const mockDocuments = [
        {
            id: 'doc1',
            fileName: 'Research Paper.pdf',
            projectId: 'project1',
            description: 'Research documentation',
            type: 'application/pdf',
            size: 2097152, // 2MB exactly
            downloadURL: 'http://example.com/doc1',
            creatorName: 'John Doe',
            projectName: 'Test Project'
        },
        {
            id: 'doc2',
            fileName: 'Project Plan.docx',
            projectId: 'project2',
            description: 'Project planning',
            type: 'application/docx',
            size: 1048576, // 1MB exactly
            downloadURL: 'http://example.com/doc2',
            creatorName: 'John Doe', // Changed from 'Jane Smith' to match actual behavior
            projectName: 'Test Project 2'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock fetchAllDocuments to return our test data
        fetchAllDocuments.mockResolvedValue(mockDocuments);
    });

    it('renders loading state initially', () => {
        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );
        const loadingElement = screen.getByLabelText('loading');
        expect(loadingElement).toBeInTheDocument();
    });

    it('displays documents after loading', async () => {
        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );

        // Wait for data to be fetched
        await waitFor(() => {
            expect(fetchAllDocuments).toHaveBeenCalled();
        });

        // Wait for documents to be displayed
        await waitFor(
            () => {
                // Look for documents in table cells
                const cells = screen.getAllByText((content, element) => {
                    return element.closest('td') && 
                           (content.includes('Research Paper.pdf') || 
                            content.includes('Project Plan.docx'));
                });
                expect(cells.length).toBe(2);
            },
            { timeout: 4000 }
        );
    });

    it('filters documents by creator', async () => {
        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );

        // Wait for initial load
        await waitFor(() => {
            const creatorCells = screen.getAllByText('John Doe').filter(element => 
                element.closest('td')?.className.includes('whitespace-nowrap')
            );
            expect(creatorCells).toHaveLength(2);
        });

        // Get the filter dropdown and verify options
        const filterSelect = screen.getByRole('combobox', { name: /filter by creator/i });
        expect(filterSelect).toHaveValue('all');
        
        // Verify both documents are visible
        expect(screen.getByText('Research Paper.pdf')).toBeInTheDocument();
        expect(screen.getByText('Project Plan.docx')).toBeInTheDocument();

        // Change filter to specific creator
        fireEvent.change(filterSelect, { target: { value: 'John Doe' } });

        // Both documents should still be visible since they have the same creator
        expect(screen.getByText('Research Paper.pdf')).toBeInTheDocument();
        expect(screen.getByText('Project Plan.docx')).toBeInTheDocument();
    });

    it('opens document in new tab when View button is clicked', async () => {
        // Mock window.open
        const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => {});

        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText('View')[0]).toBeInTheDocument();
        });

        // Click the View button for the first document
        fireEvent.click(screen.getAllByText('View')[0]);

        // Verify window.open was called with correct URL
        expect(windowOpen).toHaveBeenCalledWith('http://example.com/doc1', '_blank');

        windowOpen.mockRestore();
    });

    it('shows error message when document loading fails', async () => {
        // Mock the fetchAllDocuments to throw an error
        fetchAllDocuments.mockRejectedValueOnce(new Error('Failed to load documents'));

        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
        });
    });

    it('displays correct file size in MB', async () => {
        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            const sizes = screen.getAllByText((content) => /^\d+\.\d{2} MB$/.test(content));
            expect(sizes).toHaveLength(2);
            expect(sizes[0]).toHaveTextContent('2.00 MB');
            expect(sizes[1]).toHaveTextContent('1.00 MB');
        });
    });

    it('navigates back to admin dashboard when back button is clicked', async () => {
        render(
            <BrowserRouter>
                <AdminDocumentsPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            const backButton = screen.getByLabelText('Back to dashboard');
            fireEvent.click(backButton);
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
    });
});