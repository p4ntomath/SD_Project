import { useState } from 'react';
import { submitReviewFeedback } from '../../backend/firebase/reviewerDB';

export default function ReviewFeedbackForm({ projectId, reviewerId, onSubmitComplete }) {
    const [feedback, setFeedback] = useState({
        comment: '',
        rating: 3,
        status: 'approved'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; // Prevent double submission
        setLoading(true);
        setError(null);

        try {
            await submitReviewFeedback(projectId, reviewerId, feedback);
            // Immediately call onSubmitComplete to trigger navigation
            onSubmitComplete?.();
        } catch (err) {
            setError(err.message);
            setLoading(false); // Only reset loading on error
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Review Decision
                </label>
                <select
                    id="status"
                    value={feedback.status}
                    onChange={(e) => setFeedback({ ...feedback, status: e.target.value })}
                    className="mt-1 block w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                >
                    <option value="approved">Approve Project</option>
                    <option value="rejected">Reject Project</option>
                    <option value="needs_revision">Request Revisions</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                    Choose your final review decision for this project
                </p>
            </section>

            <section>
                <label className="block text-sm font-medium text-gray-700">
                    Project Rating
                </label>
                <section className="flex items-center space-x-2 mt-1" role="radiogroup" aria-label="Star rating buttons">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => !loading && setFeedback({ ...feedback, rating: star })}
                            className="p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                            aria-label={`Rate ${star} stars`}
                            aria-pressed={star <= feedback.rating}
                            disabled={loading}
                        >
                            <svg
                                className={`h-8 w-8 ${
                                    star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </section>
            </section>

            <section>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                    Feedback Comments
                </label>
                <textarea
                    id="comment"
                    rows={4}
                    value={feedback.comment}
                    onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                    className="mt-1 block w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Provide detailed feedback about the project..."
                    required
                    disabled={loading}
                />
            </section>

            {error && (
                <section className="text-red-600 text-sm">
                    {error}
                </section>
            )}

            <button
                type="submit"
                disabled={loading || !feedback.comment.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    );
}