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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading feedback: {error}
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No feedback available yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback.map((review) => (
        <div key={review.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {review.reviewer?.name || 'Anonymous Reviewer'}
              </h3>
              <p className="text-sm text-gray-500">
                {review.reviewer?.expertise || 'Expertise not specified'}
              </p>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{
                backgroundColor: review.status === 'approved' ? 'rgb(220 252 231)' : 
                               review.status === 'rejected' ? 'rgb(254 226 226)' :
                               review.status === 'needs_revision' ? 'rgb(254 249 195)' : 
                               'rgb(229 231 235)',
                color: review.status === 'approved' ? 'rgb(22 101 52)' :
                       review.status === 'rejected' ? 'rgb(153 27 27)' :
                       review.status === 'needs_revision' ? 'rgb(133 77 14)' :
                       'rgb(55 65 81)'
              }}>
                {review.status === 'approved' ? 'Approved' :
                 review.status === 'rejected' ? 'Rejected' :
                 review.status === 'needs_revision' ? 'Needs Revision' :
                 'In Progress'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="flex-1">
                <div className="flex items-center">
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
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <p className="text-gray-700 whitespace-pre-wrap">{review.feedback}</p>
        </div>
      ))}
    </div>
  );
}