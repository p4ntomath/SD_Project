import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReviewFeedbackForm from '../components/ReviewerComponents/ReviewFeedbackForm';
import { submitReviewFeedback } from '../backend/firebase/reviewerDB';

// Mock the reviewdb functions
vi.mock('../backend/firebase/reviewerDB', () => ({
    submitReviewFeedback: vi.fn()
}));

describe('ReviewFeedbackForm Component', () => {
    const mockProjectId = 'test-project-id';
    const mockReviewerId = 'test-reviewer-id';
    const mockOnSubmitComplete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock implementation
        submitReviewFeedback.mockImplementation(() => Promise.resolve());
    });

    it('renders form with all required fields', () => {
        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        // Check if all form elements are present
        expect(screen.getByLabelText(/review decision/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/project rating/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/feedback comments/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });

    it('initializes with default values', () => {
        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        // Check default values
        expect(screen.getByLabelText(/review decision/i)).toHaveValue('approved');
        expect(screen.getByLabelText(/feedback comments/i)).toHaveValue('');
        // Default rating is 3, check if 3 stars are filled
        const stars = screen.getAllByRole('button').filter(button => 
            button.getAttribute('aria-label')?.toLowerCase().includes('rate')
        );
        expect(stars).toHaveLength(5); // 5 star buttons
        stars.forEach((star, index) => {
            // First 3 stars should be filled (yellow)
            const svg = star.querySelector('svg');
            if (index < 3) {
                expect(svg).toHaveClass('text-yellow-400');
                expect(star).toHaveAttribute('aria-pressed', 'true');
            } else {
                expect(svg).toHaveClass('text-gray-300');
                expect(star).toHaveAttribute('aria-pressed', 'false');
            }
        });
    });

    it('updates form values on user input', () => {
        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        // Change status
        fireEvent.change(screen.getByLabelText(/review decision/i), {
            target: { value: 'approved' }
        });
        expect(screen.getByLabelText(/review decision/i)).toHaveValue('approved');

        // Change rating
        const stars = screen.getAllByRole('button');
        fireEvent.click(stars[4]); // Click 5th star

        // Add comment
        fireEvent.change(screen.getByLabelText(/feedback comments/i), {
            target: { value: 'Great project!' }
        });
        expect(screen.getByLabelText(/feedback comments/i)).toHaveValue('Great project!');
    });

    it('submits form with correct data', async () => {
        submitReviewFeedback.mockResolvedValue();

        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/review decision/i), {
            target: { value: 'approved' }
        });
        const stars = screen.getAllByRole('button');
        fireEvent.click(stars[4]); // 5 stars
        fireEvent.change(screen.getByLabelText(/feedback comments/i), {
            target: { value: 'Excellent work!' }
        });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

        await waitFor(() => {
            expect(submitReviewFeedback).toHaveBeenCalledWith(
                mockProjectId,
                mockReviewerId,
                expect.objectContaining({
                    status: 'approved',
                    rating: 5,
                    comment: 'Excellent work!'
                })
            );
            expect(mockOnSubmitComplete).toHaveBeenCalled();
        });
    });

    it('handles submission error', async () => {
        const errorMessage = 'Failed to submit review';
        submitReviewFeedback.mockRejectedValue(new Error(errorMessage));

        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        // Fill and submit form
        fireEvent.change(screen.getByLabelText(/feedback comments/i), {
            target: { value: 'Test comment' }
        });
        fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(mockOnSubmitComplete).not.toHaveBeenCalled();
        });
    });

    it('disables submit button when form is submitting', async () => {
        submitReviewFeedback.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/feedback comments/i), {
            target: { value: 'Test comment' }
        });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /submit review/i });
        fireEvent.click(submitButton);

        // Button should be disabled and show loading state
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Submitting...')).toBeInTheDocument();

        // Wait for submission to complete and check that form remains disabled
        await waitFor(() => {
            expect(mockOnSubmitComplete).toHaveBeenCalled();
        });
    });

    it('requires comment field to submit', () => {
        render(
            <ReviewFeedbackForm 
                projectId={mockProjectId}
                reviewerId={mockReviewerId}
                onSubmitComplete={mockOnSubmitComplete}
            />
        );

        const submitButton = screen.getByRole('button', { name: /submit review/i });
        expect(submitButton).toBeDisabled();

        // Add comment
        fireEvent.change(screen.getByLabelText(/feedback comments/i), {
            target: { value: 'Test comment' }
        });
        expect(submitButton).not.toBeDisabled();

        // Remove comment
        fireEvent.change(screen.getByLabelText(/feedback comments/i), {
            target: { value: '' }
        });
        expect(submitButton).toBeDisabled();
    });
});