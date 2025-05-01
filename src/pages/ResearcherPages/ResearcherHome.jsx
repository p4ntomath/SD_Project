import { useEffect, useState } from 'react';
import { fetchProjects } from '../../backend/firebase/projectDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import { ClipLoader } from "react-spinners";
import MainNav from '../../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FaChartLine, FaPiggyBank, FaFolder } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

export default function ResearcherHome() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchAllProjects = async (user) => {
    try {
      setLoading(true);
      const fetchedProjects = await fetchProjects(user.uid);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAllProjects(user);
      } else {
        console.error("User not authenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  // Calculate funding totals
  const totalAvailableFunds = projects.reduce((sum, project) => sum + (project.availableFunds || 0), 0);
  const totalUsedFunds = projects.reduce((sum, project) => sum + (project.usedFunds || 0), 0);

  return (
    <section data-testid="researcher-home" className="min-h-screen bg-gray-50 flex flex-col">
      <header>
        <MainNav 
          setMobileMenuOpen={setMobileMenuOpen} 
          mobileMenuOpen={mobileMenuOpen}
        />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
          
          {loading ? (
            <section className="flex justify-center items-center py-20">
              <ClipLoader color="#3B82F6" />
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Funding Summary Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaPiggyBank className="mr-2 text-pink-500 text-2xl" />
                  <h2 className="text-xl font-bold text-gray-800">Funding Summary</h2>
                </section>
                
                {projects.length > 0 ? (
                  <section className="space-y-4">
                    <section className="flex justify-between items-center">
                      <p className="text-gray-600">Available Funds</p>
                      <p className="font-medium">R {totalAvailableFunds.toLocaleString()}</p>
                    </section>
                    <section className="flex justify-between items-center">
                      <p className="text-gray-600">Funds Used</p>
                      <p className="font-medium">R {totalUsedFunds.toLocaleString()}</p>
                    </section>

                    <section className="pt-2">
                      <button
                        onClick={() => navigate('/projects')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                      >
                        <FaFolder className="mr-2" />
                        View Projects
                      </button>
                    </section>
                  </section>
                ) : (
                  <p className="text-gray-500 text-center py-4">No funding to track</p>
                )}
              </article>
            </section>
          )}
        </section>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </section>
  );
}