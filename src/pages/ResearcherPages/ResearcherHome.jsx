import { useEffect, useState } from 'react';
import { fetchProjects } from '../../backend/firebase/projectDB';
import { auth } from '../../backend/firebase/firebaseConfig';
import MainNav from '../../components/ResearcherComponents/Navigation/MainNav';
import MobileBottomNav from '../../components/ResearcherComponents/Navigation/MobileBottomNav';
import { FaChartLine, FaPiggyBank, FaFolder, FaClipboardCheck, FaUsers, FaClock } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import CollaborationRequestsSection from '../../components/ResearcherComponents/CollaborationRequestsSection';

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

  // Calculate totals and statistics
  const totalAvailableFunds = projects.reduce((sum, project) => sum + (project.availableFunds || 0), 0);
  const totalUsedFunds = projects.reduce((sum, project) => sum + (project.usedFunds || 0), 0);
  const totalProjects = projects.length;
  const activeProjects = projects.filter(project => project.status === 'In Progress').length;
  const completedProjects = projects.filter(project => {
    if (!project.goals || project.goals.length === 0) return false;
    return project.goals.every(goal => goal.completed);
  }).length;
  const totalCollaborators = [...new Set(projects.flatMap(project => project.collaborators || []))].length;
  
  const calculateOverallProgress = () => {
    if (projects.length === 0) return 0;
    const totalProgress = projects.reduce((sum, project) => {
      if (!project.goals || project.goals.length === 0) return sum;
      const projectProgress = (project.goals.filter(goal => goal.completed).length / project.goals.length) * 100;
      return sum + projectProgress;
    }, 0);
    return Math.round(totalProgress / projects.length);
  };

  const SkeletonCard = () => (
    <div data-testid="skeleton-card" className="bg-white p-6 rounded-lg shadow-md border border-gray-100 animate-pulse">
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
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Projects Overview Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaFolder className="mr-2 text-blue-500 text-2xl" />
                  <h2 className="text-xl font-bold text-gray-800">Projects Overview</h2>
                </section>
                <section className="space-y-4">
                  <section className="grid grid-cols-2 gap-4">
                    <section className="text-center p-3 bg-gray-50 rounded-lg">
                      <p data-testid="total-projects" className="text-2xl font-bold text-blue-600">{totalProjects}</p>
                      <p className="text-sm text-gray-600">Total Projects</p>
                    </section>
                    <section className="text-center p-3 bg-gray-50 rounded-lg">
                      <p data-testid="active-projects" className="text-2xl font-bold text-green-600">{activeProjects}</p>
                      <p className="text-sm text-gray-600">Active</p>
                    </section>
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
              </article>

              {/* Funding Summary Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaPiggyBank className="mr-2 text-pink-500 text-2xl" />
                  <h2 className="text-xl font-bold text-gray-800">Funding Summary</h2>
                </section>
                
                {projects.length > 0 ? (
                  <section className="space-y-4">
                    <section className="grid grid-cols-1 gap-4">
                      <section className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Available Funds</p>
                        <p className="text-xl font-bold text-green-600">R {totalAvailableFunds.toLocaleString()}</p>
                      </section>
                      <section className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Used Funds</p>
                        <p className="text-xl font-bold text-blue-600">R {totalUsedFunds.toLocaleString()}</p>
                      </section>
                    </section>

                    <section className="pt-2">
                      <button
                        onClick={() => navigate('/trackfunding')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                      >
                        <FaChartLine className="mr-2" />
                        Track Funding
                      </button>
                    </section>
                  </section>
                ) : (
                  <p className="text-gray-500 text-center py-4">No funding to track</p>
                )}
              </article>

              {/* Progress Summary Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaClipboardCheck className="mr-2 text-green-500 text-2xl" />
                  <h2 className="text-xl font-bold text-gray-800">Progress Overview</h2>
                </section>
                
                {projects.length > 0 ? (
                  <section className="space-y-4">
                    <section className="grid grid-cols-2 gap-4">
                      <section className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{calculateOverallProgress()}%</p>
                        <p className="text-sm text-gray-600">Overall Progress</p>
                      </section>
                      <section className="text-center p-3 bg-gray-50 rounded-lg">
                        <p data-testid="completed-projects" className="text-2xl font-bold text-blue-600">{completedProjects}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </section>
                    </section>
                    <section className="w-full bg-gray-200 rounded-full h-2">
                      <section 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${calculateOverallProgress()}%` }}
                      />
                    </section>
                  </section>
                ) : (
                  <p className="text-gray-500 text-center py-4">No projects to track</p>
                )}
              </article>

              {/* Recent Activity Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaClock className="mr-2 text-orange-500 text-2xl" />
                  <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                </section>
                {projects.length > 0 ? (
                  <section className="space-y-3">
                    {projects.slice(0, 3).map(project => (
                      <section 
                        key={project.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate(`/projects/${project.id}`, { state: project })}
                      >
                        <p className="font-medium text-gray-800">{project.title}</p>
                        <p className="text-sm text-gray-600">Status: {project.status}</p>
                      </section>
                    ))}
                  </section>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </article>

              {/* Collaboration Requests Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <svg className="mr-2 text-purple-500 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">Collaboration Requests</h2>
                </section>
                <CollaborationRequestsSection />
              </article>

              {/* Team Overview Card */}
              <article className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaUsers className="mr-2 text-indigo-500 text-2xl" />
                  <h2 className="text-xl font-bold text-gray-800">Team Overview</h2>
                </section>
                {projects.length > 0 ? (
                  <section className="space-y-4">
                    <section className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">{totalCollaborators}</p>
                      <p className="text-sm text-gray-600">Total Collaborators</p>
                    </section>
                    <p className="text-sm text-gray-600">
                      Across {totalProjects} {totalProjects === 1 ? 'project' : 'projects'}
                    </p>
                  </section>
                ) : (
                  <p className="text-gray-500 text-center py-4">No team members yet</p>
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