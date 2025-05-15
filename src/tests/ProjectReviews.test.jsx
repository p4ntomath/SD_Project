import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProjectReviews from '../components/ReviewerComponents/ProjectReviews';
import { getProjectReviews } from '../backend/firebase/reviewerDB';

// Mock the reviewdb functions
vi.mock('../backend/firebase/reviewdb', () => ({
    getProjectReviews: vi.fn()
}));

// Suppress console errors and warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        const skipMessages = [
            'An update to ProjectReviews inside a test was not wrapped in act',
            'When testing, code that causes React state updates should be wrapped into act',
            'ensures that you\'re testing the behavior the user would see in the browser'
        ];

        if (skipMessages.some(msg => args.some(arg => 
            (typeof arg === 'string' && arg.includes(msg)) ||
            (arg?.message && arg.message.includes(msg))
        ))) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args) => {
        const skipMessages = [
            'An update to ProjectReviews inside a test was not wrapped in act',
            'When testing, code that causes React state updates should be wrapped into act'
        ];

        if (skipMessages.some(msg => args.some(arg => 
            (typeof arg === 'string' && arg.includes(msg)) ||
            (arg?.message && arg.message.includes(msg))
        ))) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});


const mockReviews = [
    {
        id: 'review1',
        feedback: 'Great project',
        rating: 4,
        status: 'approved',
        reviewer: {
            id: 'reviewer1',
            fullName: 'John Doe',
            expertise: 'Computer Science'
        },
        createdAt: { seconds: Date.now() / 1000 }
    },
    {
        id: 'review2',
        feedback: 'Needs improvement',
        rating: 3,
        status: 'revisions_needed',
        reviewer: {
            id: 'reviewer2',
            fullName: 'Jane Smith',
            expertise: 'Data Science'
        },
        createdAt: { seconds: Date.now() / 1000 }
    }
];

describe('ProjectReviews Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays loading state initially', () => {
        getProjectReviews.mockResolvedValue([]);
        render(<ProjectReviews projectId="test-project" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('displays reviews when loaded successfully', async () => {
        getProjectReviews.mockResolvedValue(mockReviews);
        render(<ProjectReviews projectId="test-project" />);

        await waitFor(() => {
            expect(screen.getByText('Great project')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Computer Science')).toBeInTheDocument();
            expect(screen.getByText('Needs improvement')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('Data Science')).toBeInTheDocument();
        });
    });

    it('displays error message when loading fails', async () => {
        const errorMessage = 'Failed to load reviews';
        getProjectReviews.mockRejectedValue(new Error(errorMessage));
        render(<ProjectReviews projectId="test-project" />);

        await waitFor(() => {
            expect(screen.getByText(`Error loading reviews: ${errorMessage}`)).toBeInTheDocument();
        });
    });

    it('displays "No reviews available yet" message when there are no reviews', async () => {
        getProjectReviews.mockResolvedValue([]);
        render(<ProjectReviews projectId="test-project" />);

        await waitFor(() => {
            expect(screen.getByText('No reviews available yet')).toBeInTheDocument();
        });
    });

    it('calls getProjectReviews with correct project ID', () => {
        const projectId = 'test-project';
        render(<ProjectReviews projectId={projectId} />);
        expect(getProjectReviews).toHaveBeenCalledWith(projectId);
    });
});