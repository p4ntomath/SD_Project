import { useState, useEffect } from 'react';
import { getProjectReviews } from '../../backend/firebase/reviewerDB';

/**
 * ProjectReviews Component - Displays all reviews for a project
 * 
 * @param {string} projectId - ID of the project to fetch reviews for
 * @param {function} formatDate - Function to format review dates
 */

export default function ProjectReviews({ projectId, formatDate }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

     // Fetch reviews when projectId changes
    useEffect(() => {
        loadReviews();
    }, [projectId]);

    const loadReviews = async () => {
        try {
            const projectReviews = await getProjectReviews(projectId);
            setReviews(projectReviews);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="flex justify-center items-center py-8">
                <section 
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    role="status"
                    aria-label="Loading reviews"
                />
            </section>
        );
    }

    if (error) {
        return (
            <section className="text-red-600 text-center py-4">
                Error loading reviews: {error}
            </section>
        );
    }

    if (reviews.length === 0) {
        return (
            <section className="text-center py-6">
                <p className="text-gray-500">No reviews available yet</p>
            </section>
        );
    }

    return (
        <section className="overflow-hidden">
            <section className="overflow-y-auto max-h-[230px] pr-2 -mr-2 no-scrollbar">
                <section className="space-y-6">
                    {reviews.map((review) => (
                        <section key={review.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <section className="flex items-center justify-between mb-4">
                                <section>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {review.reviewer?.fullName || 'Anonymous Reviewer'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {review.reviewer?.fieldOfResearch || 'Expertise not specified'}
                                    </p>
                                </section>
                                <section className="flex items-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                        ${review.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          review.status === 'needs_revision' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'}`}
                                    >
                                        {review.status === 'approved' ? 'Approved' :
                                         review.status === 'rejected' ? 'Rejected' :
                                         review.status === 'needs_revision' ? 'Needs Revision' :
                                         'In Progress'}
                                    </span>
                                </section>
                            </section>

                            <section className="mb-4">
                                <section className="flex items-center mb-2">
                                    <section className="flex-1">
                                        <section className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg
                                                    key={star}
                                                    className={`h-5 w-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </section>
                                    </section>
                                    <section className="text-sm text-gray-500">
                                        {formatDate(review.createdAt)}
                                    </section>
                                </section>
                            </section>

                            <p className="text-gray-700 whitespace-pre-wrap break-words">{review.feedback}</p>
                        </section>
                    ))}
                </section>
            </section>
        </section>
    );
}