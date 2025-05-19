import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNav from '../components/ReviewerComponents/Navigation/ReviewerMainNav';
import MobileBottomNav from '../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';
import { ClipboardDocumentListIcon, ClockIcon, ChartBarIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { ClipLoader } from "react-spinners";
import { auth } from "../backend/firebase/firebaseConfig";
import { getReviewerRequests, updateReviewRequestStatus } from "../backend/firebase/reviewerDB";

export default function ReviewerHomePage() {
  const [loading, setLoading] = useState(true);
  const [reviewRequests, setReviewRequests] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    requests: 0,
    pending: 0,
    completed: 0,
    totalReviews: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadReviewRequests = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const requests = await getReviewerRequests(currentUser.uid);
        setReviewRequests(requests);
        
        // Calculate stats
        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
        const completed = requests.filter(r => r.status === 'completed').length;

        setStats({
          requests: pendingRequests,
          pending: acceptedRequests,  // Show accepted requests as pending reviews
          completed,
          totalReviews: requests.length
        });
      } catch (error) {
        console.error("Error loading review requests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviewRequests();
  }, [navigate]);

  const handleViewPendingReviews = () => {
    // Navigate to the review requests page where user can see project details
    navigate('/reviewer/requests', { state: { reviewRequests } });
  };

  const handleViewCompletedReviews = () => {
    navigate('/reviewer/history');
  };

  const handleSearch = (query) => {
    // TODO: Implement review search
    console.log("Searching for:", query);
  };

  return (
    <section className="min-h-screen bg-gray-50">
      <header>
        <MainNav 
          setMobileMenuOpen={setMobileMenuOpen} 
          mobileMenuOpen={mobileMenuOpen}
          onSearch={handleSearch}
        />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-16 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Overview */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <article 
              onClick={handleViewPendingReviews}
              className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Review Requests</p>
                  {loading ? (
                    <div className="h-9 flex items-center" data-testid="loading-spinner">
                      <ClipLoader  color="#ffffff" size={24} />
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold"
                    data-testid="review-requests-count"
                    >{stats.requests}</h3>
                  )}
                </div>
                <ClipboardDocumentListIcon className="h-12 w-12 opacity-20" />
              </div>
            </article>

            <article 
              onClick={() => navigate('/reviewer/assigned')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Pending Reviews</p>
                  {loading ? (
                    <div className="h-9 flex items-center">
                      <ClipLoader color="#ffffff" size={24} />
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold" 
                    data-testid="pending-reviews-count"
                    >{stats.pending}</h3>
                  )}
                </div>
                <ClipboardDocumentListIcon className="h-12 w-12 opacity-20" />
              </div>
            </article>

            <article 
              onClick={handleViewCompletedReviews}
              className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Completed Reviews</p>
                  {loading ? (
                    <div className="h-9 flex items-center">
                      <ClipLoader color="#ffffff" size={24} />
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold"
                    data-testid="completed-reviews-count"
                    >{stats.completed}</h3>
                  )}
                </div>
                <DocumentTextIcon className="h-12 w-12 opacity-20" />
              </div>
            </article>

            <article className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-md text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100">Total Reviews</p>
                  {loading ? (
                    <div className="h-9 flex items-center">
                      <ClipLoader color="#ffffff" size={24} />
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold"
                    data-testid="total-reviews-count"
                    >{stats.totalReviews}</h3>
                  )}
                </div>
                <ChartBarIcon className="h-12 w-12 opacity-20" />
              </div>
            </article>
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
            data-testid="view-requests-button"
              onClick={handleViewPendingReviews}
              className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:border-blue-400 transition-colors"
            >
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">View Requests</span>
            </button>

            <button
              onClick={() => navigate('/reviewer/history')}
              className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:border-blue-400 transition-colors"
            >
              <ClockIcon className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Review History</span>
            </button>

            <button
              onClick={() => navigate('/reviewer/analytics')}
              className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:border-blue-400 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-700">View Analytics</span>
            </button>
          </section>
        </div>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </section>
  );
}