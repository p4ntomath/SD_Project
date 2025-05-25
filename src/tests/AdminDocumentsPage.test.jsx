import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDocumentsPage from '../pages/AdminDocumentsPage';
import { fetchAllDocuments } from '../backend/firebase/documentsDB';
import { getDoc } from 'firebase/firestore';
import '@testing-library/jest-dom';

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

// Mock Firestore with all required functions
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(() => ({
        exists: () => true,
        data: () => ({
            title: 'Test Project',
            userId: 'user1',
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
    CACHE_SIZE_UNLIMITED: 'unlimited',
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
    enableMultiTabIndexedDbPersistence: vi.fn()
}));

// Mock Framer Motion
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

// Mock react-icons
vi.mock('react-icons/fa', () => ({
    FaArrowLeft: () => <div data-testid="mock-arrow-icon" />,
    FaSearch: () => <div data-testid="mock-search-icon" />,
    FaDownload: () => <div data-testid="mock-download-icon" />,
    FaCheck: () => <div data-testid="mock-check-icon" />,
    FaTimes: () => <div data-testid="mock-times-icon" />
}));

// Mock components
vi.mock('../components/AdminComponents/Navigation/AdminMainNav', () => ({
    default: () => <div data-testid="mock-main-nav">MainNav</div>
}));

vi.mock('../components/AdminComponents/Navigation/AdminMobileBottomNav', () => ({
    default: () => <div data-testid="mock-bottom-nav">BottomNav</div>
}));

// Mock ClipLoader
vi.mock('react-spinners', () => ({
    ClipLoader: () => <div aria-label="loading">Loading...</div>
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
            creatorName: 'John Doe',
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
        // Check that loading elements exist
        const loadingElements = screen.getAllByLabelText('loading');
        expect(loadingElements.length).toBeGreaterThan(0);
        expect(loadingElements[0]).toBeInTheDocument();
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