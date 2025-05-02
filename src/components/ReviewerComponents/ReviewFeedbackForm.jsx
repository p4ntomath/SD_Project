import { useState } from 'react';
import { submitReviewFeedback } from '../../backend/firebase/reviewdb';

export default function ReviewFeedbackForm({ projectId, reviewerId, onSubmitComplete }) {
    const [feedback, setFeedback] = useState({
        comment: '',
        rating: 3,
        status: 'pending'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await submitReviewFeedback(projectId, reviewerId, feedback);
            onSubmitComplete?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Review Status
                </label>
                <select
                    id="status"
                    value={feedback.status}
                    onChange={(e) => setFeedback({ ...feedback, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                >
                    <option value="pending">In Progress</option>
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="needs_revision">Needs Revision</option>
                </select>
            </div>

            <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                    Rating (1-5)
                </label>
                <div className="flex items-center space-x-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setFeedback({ ...feedback, rating: star })}
                            className={`p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full`}
                        >
                            <svg
                                className={`h-8 w-8 ${
                                    star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                    Feedback Comments
                </label>
                <textarea
                    id="comment"
                    rows={4}
                    value={feedback.comment}
                    onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Provide detailed feedback about the project..."
                    required
                />
            </div>

            {error && (
                <div className="text-red-600 text-sm">
                    {error}
                </div>
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