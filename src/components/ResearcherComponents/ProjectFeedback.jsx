import { useState, useEffect } from 'react';
import { getProjectFeedback } from '../../backend/firebase/reviewerDB';

export default function ProjectFeedback({ projectId }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const projectFeedback = await getProjectFeedback(projectId);
        setFeedback(projectFeedback);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [projectId]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'approved':
        return { text: 'Project Approved', style: { backgroundColor: 'rgb(220 252 231)', color: 'rgb(22 101 52)' } };
      case 'rejected':
        return { text: 'Project Rejected', style: { backgroundColor: 'rgb(254 226 226)', color: 'rgb(153 27 27)' } };
      case 'needs_revision':
        return { text: 'Revisions Required', style: { backgroundColor: 'rgb(254 249 195)', color: 'rgb(133 77 14)' } };
      case 'in_progress':
        return { text: 'Review in Progress', style: { backgroundColor: 'rgb(229 231 235)', color: 'rgb(55 65 81)' } };
      default:
        return { text: 'Status Pending', style: { backgroundColor: 'rgb(229 231 235)', color: 'rgb(55 65 81)' } };
    }
  };

  if (loading) {
    return (
      <section className="flex justify-center items-center py-8">
        <section role="status" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></section>
      </section>
    );
  }

  if (error) {
    return (
      <section className="text-red-600 text-center py-8">
        Error loading feedback: {error}
      </section>
    );
  }

  if (feedback.length === 0) {
    return (
      <section className="text-gray-500 text-center py-8">
        No feedback available yet
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {feedback.map((review) => (
        <section key={review.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <section className="flex items-center justify-between mb-4">
            <section>
              <h3 className="text-lg font-medium text-gray-900">
                {review.reviewer?.name || 'Anonymous Reviewer'}
              </h3>
              <p className="text-sm text-gray-500">
                {review.reviewer?.expertise || 'Field of Research not specified'}
              </p>
            </section>
            <section className="flex items-center">
              {review.status && (
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={getStatusDisplay(review.status).style}
                >
                  {getStatusDisplay(review.status).text}
                </span>
              )}
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
                      data-testid={star <= review.rating ? 'filled-star' : 'empty-star'}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </section>
              </section>
              <section className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </section>
            </section>
          </section>

          <p className="text-gray-700 whitespace-pre-wrap">{review.feedback}</p>
        </section>
      ))}
    </section>
  );
}