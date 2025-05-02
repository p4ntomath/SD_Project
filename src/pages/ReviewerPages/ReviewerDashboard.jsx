import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewerSidebar from '../../components/ReviewerComponents/ReviewerSideBar';
import ReviewerSidebarToggle from "../../components/ReviewerComponents/ReviewerSideBarToggle";
import { ClipboardDocumentListIcon, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { ClipLoader } from "react-spinners";
import { auth } from "../../backend/firebase/firebaseConfig";
import { getReviewerRequests, updateReviewRequestStatus } from "../../backend/firebase/reviewdb";

export default function ReviewerDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reviewRequests, setReviewRequests] = useState([]);
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
        setLoading(false);
      } catch (error) {
        console.error("Error loading review requests:", error);
        setLoading(false);
      }
    };

    loadReviewRequests();
  }, [navigate]);

  const handleAcceptRequest = async (requestId) => {
    try {
      await updateReviewRequestStatus(requestId, 'accepted');
      navigate(`/reviewer/review/${requestId}`);
    } catch (error) {
      console.error("Error accepting review request:", error);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await updateReviewRequestStatus(requestId, 'declined');
      // Refresh the requests list
      const updatedRequests = reviewRequests.filter(request => request.id !== requestId);
      setReviewRequests(updatedRequests);
    } catch (error) {
      console.error("Error declining review request:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <section className="min-h-screen bg-gray-50 flex">
      <ReviewerSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ReviewerSidebarToggle isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white shadow-sm p-4">
          <section className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reviewer Dashboard</h1>
          </section>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <article className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center mb-4">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Review Requests</h2>
              </div>
              <p className="text-gray-600 mb-4">
                {loading ? "Loading..." : `${reviewRequests.length} pending requests`}
              </p>
              <button
                onClick={() => document.getElementById('review-requests').scrollIntoView({ behavior: 'smooth' })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                View Requests
              </button>
            </article>

            <article className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Review History</h2>
              </div>
              <p className="text-gray-600 mb-4">View your past reviews</p>
              <button
                onClick={() => navigate('/reviewer/history')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                View History
              </button>
            </article>

            <article className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-indigo-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
              </div>
              <p className="text-gray-600 mb-4">Review performance insights</p>
              <button
                onClick={() => navigate('/reviewer/analytics')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                View Analytics
              </button>
            </article>
          </div>

          {/* Review Requests Section */}
          <section id="review-requests" className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Review Requests</h2>
            
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <ClipLoader color="#2563eb" />
              </div>
            ) : reviewRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <ClipboardDocumentListIcon 
                  className="mx-auto h-12 w-12 text-gray-400"
                  aria-hidden="true"
                />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No pending review requests
                </h3>
                <p className="mt-1 text-gray-500">
                  New projects will appear here when they're ready for your evaluation
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {reviewRequests.map((request) => (
                  <article 
                    key={request.id} 
                    className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.project.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Submitted by: {request.project.researcherName}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </section>
  );
}