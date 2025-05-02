import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewerMainNav from '../components/ReviewerComponents/Navigation/ReviewerMainNav';
import ReviewerMobileBottomNav from '../components/ReviewerComponents/Navigation/ReviewerMobileBottomNav';
import { ClipboardDocumentListIcon, ClipboardDocumentCheckIcon, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { ClipLoader } from "react-spinners";
import { auth } from "../backend/firebase/firebaseConfig";

export default function ReviewerHomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (query) => {
    console.log('Searching:', query);
    // TODO: Implement search functionality
  };

  useEffect(() => {
    // Simulate loading reviews - replace with actual API call
    const loadReviews = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to fetch assigned reviews
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error) {
        console.error("Error loading reviews:", error);
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 animate-pulse">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-100 rounded-lg"></div>
          <div className="h-20 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-10 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen bg-gray-50 flex flex-col">
      <header>
        <ReviewerMainNav
          setMobileMenuOpen={setMobileMenuOpen}
          mobileMenuOpen={mobileMenuOpen}
          onSearch={handleSearch}
        />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

          {loading ? (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Assigned Reviews Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Assigned Reviews</h2>
                </section>
                <section className="space-y-4">
                  <section className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">Pending Reviews</p>
                  </section>
                  <button
                    onClick={() => navigate('/reviewer/assigned')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                  >
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                    View Assigned Reviews
                  </button>
                </section>
              </article>

              {/* Review History Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <ClockIcon className="h-6 w-6 text-green-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Review History</h2>
                </section>
                <section className="space-y-4">
                  <section className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">0</p>
                    <p className="text-sm text-gray-600">Completed Reviews</p>
                  </section>
                  <button
                    onClick={() => navigate('/reviewer/history')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    View Review History
                  </button>
                </section>
              </article>

              {/* Review Analytics Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <ChartBarIcon className="h-6 w-6 text-indigo-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Review Analytics</h2>
                </section>
                <section className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <section className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">0</p>
                      <p className="text-sm text-gray-600">Avg. Review Time</p>
                    </section>
                    <section className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">0</p>
                      <p className="text-sm text-gray-600">Review Score</p>
                    </section>
                  </div>
                  <button
                    onClick={() => navigate('/reviewer/analytics')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    View Analytics
                  </button>
                </section>
              </article>

              {/* Latest Reviews Section */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-pink-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Latest Reviews</h2>
                </section>
                {assignedProjects.length > 0 ? (
                  <div className="space-y-3">
                    {assignedProjects.slice(0, 3).map(project => (
                      <div 
                        key={project.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate(`/reviewer/review/${project.id}`)}
                      >
                        <p className="font-medium text-gray-800">{project.title}</p>
                        <p className="text-sm text-gray-600">Due: {project.dueDate}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No reviews assigned</h3>
                    <p className="mt-1 text-gray-500">New reviews will appear here when they're assigned to you</p>
                  </div>
                )}
              </article>
            </section>
          )}
        </section>
      </main>

      <footer>
        <ReviewerMobileBottomNav />
      </footer>
    </section>
  );
}