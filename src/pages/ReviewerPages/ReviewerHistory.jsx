import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../backend/firebase/firebaseConfig';
import { getReviewerHistory } from '../../backend/firebase/reviewerDB';
import { ClipLoader } from 'react-spinners';
import ReviewerMainNav from '../../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';

export default function ReviewerHistory() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadCompletedReviews = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          navigate('/login');
          return;
        }

        const reviewerHistory = await getReviewerHistory(userId);
        setReviews(reviewerHistory);
      } catch (err) {
        
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCompletedReviews();
  }, [navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    try {
      if (typeof timestamp === 'object' && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_revision':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <section className="flex justify-center items-center min-h-screen">
        <ClipLoader color="#3B82F6" />
      </section>
    );
  }

  return (
    <>
      <ReviewerMainNav 
        setMobileMenuOpen={setMobileMenuOpen}
        mobileMenuOpen={mobileMenuOpen}
      />
      <section className="min-h-screen bg-gray-50 py-8 pt-6">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Review History</h1>
            <p className="mt-1 text-sm text-gray-500">A list of all your completed project reviews</p>
          </section>

          {location.state?.message && (
            <section className="mb-6 p-4 rounded-lg bg-green-100 text-green-700">
              {location.state.message}
            </section>
          )}

          {error && (
            <section className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
              {error}
            </section>
          )}

          {reviews.length === 0 ? (
            <section className="text-center py-12 bg-white rounded-lg shadow">
              <section className="flex justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </section>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No review history</h3>
              <p className="mt-1 text-sm text-gray-500">You haven't completed any reviews yet.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4">
              {reviews.map((review) => (
                <article 
                  key={review.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <section className="p-6">
                    <section className="flex justify-between items-start">
                      <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                          {review.projectTitle || 'Untitled Project'}
                        </h2>
                        <section className="grid grid-cols-2 gap-4 text-sm">
                          <section>
                            <h3 className="font-medium text-gray-500">Researcher</h3>
                            <p className="text-gray-900">{review.researcherName || 'Unknown Researcher'}</p>
                          </section>
                          <section>
                            <h3 className="font-medium text-gray-500">Review Date</h3>
                            <p className="text-gray-900">{formatDate(review.updatedAt || review.createdAt)}</p>
                          </section>
                        </section>
                      </section>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                        {(review.status || 'Pending').charAt(0).toUpperCase() + (review.status || 'pending').slice(1)}
                      </span>
                    </section>
                    
                    {review.feedback && (
                      <section className="mt-4 border-t border-gray-200 pt-4">
                        <section className="flex items-center mb-2">
                          <h3 className="font-medium text-gray-500">Rating:</h3>
                          <section className="flex ml-2">
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
                        <h3 className="font-medium text-gray-500 mb-2">Your Feedback</h3>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{review.feedback}</p>
                      </section>
                    )}
                  </section>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
      <ReviewerMobileBottomNav />
    </>
  );
}