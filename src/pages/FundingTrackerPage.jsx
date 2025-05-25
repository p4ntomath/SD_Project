import { useEffect, useState } from 'react';
import { FaPiggyBank, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../backend/firebase/projectDB';
import { fetchFunding } from '../backend/firebase/fundingDB';
import { auth } from '../backend/firebase/firebaseConfig';
import MainNav from "../components/ResearcherComponents/Navigation/MainNav";
import MobileBottomNav from '../components/ResearcherComponents/Navigation/MobileBottomNav';

export default function FundingTrackerPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fundingOpportunities, setFundingOpportunities] = useState([]);
  const [fundingLoading, setFundingLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProjects = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const fetchedProjects = await fetchProjects(user.uid);
          setProjects(fetchedProjects);
          setFilteredProjects(fetchedProjects);
        } catch (error) {
          console.error("Error fetching projects:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProjects();
  }, []);

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        const data = await fetchFunding();
        setFundingOpportunities(data);
      } catch (error) {
        console.error("Error loading funding opportunities:", error);
      } finally {
        setFundingLoading(false);
      }
    };

    loadFundingData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  // Calculate total funds correctly
  const totalOriginalFunds = projects.reduce((sum, project) => {
    const available = project.availableFunds || 0;
    const used = project.usedFunds || 0;
    return sum + available + used;
  }, 0);
  
  const totalUsedFunds = projects.reduce((sum, project) => 
    sum + (project.usedFunds || 0)
  , 0);
  
  const totalAvailableFunds = totalOriginalFunds - totalUsedFunds;
  const utilizationRate = totalOriginalFunds > 0 ? Math.min((totalUsedFunds / totalOriginalFunds) * 100, 100) : 0;

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `R ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    })}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header>
          <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
        </header>

        <main className="p-4 md:p-8 pb-16 md:pb-8">
          <section className="max-w-7xl mx-auto">
            {/* Header Section */}
            <section className="flex flex-col gap-2 mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Track Funding</h1>
              <p className="text-sm text-gray-600">Monitor and manage your research project funding</p>
            </section>

            {/* Loading Animation */}
            <section className="flex justify-center items-center py-20 space-x-2">
              {[0, 1, 2].map((i) => (
                <p
                  key={i}
                  className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </section>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AppBar */}
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-7xl mx-auto">
          {/* Header Section */}
          <section className="flex flex-col gap-2 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Track Funding</h1>
            <p className="text-sm text-gray-600">Monitor and manage your research project funding</p>
          </section>

          {/* Stats Overview Banner - Now visible on all screens */}
          <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <section className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-xl md:text-2xl font-bold">{filteredProjects.length}</p>
            </section>
            <section className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100" data-testid="total-available-stats">
              <p className="text-sm text-gray-500">Total Available Funds</p>
              <p className="text-xl md:text-2xl font-bold text-green-600" data-testid="total-available-funds-value">
                {formatCurrency(totalAvailableFunds)}
              </p>
            </section>
            <section className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Used Funds</p>
              <p className="text-xl md:text-2xl font-bold text-red-600" data-testid="total-used-funds-value">
                {formatCurrency(totalUsedFunds)}
              </p>
            </section>
            <section className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100" data-testid="utilization-rate">
              <p className="text-sm text-gray-500">Utilization Rate</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600" data-testid="utilization-rate-value">
                {utilizationRate.toFixed(1)}%
              </p>
            </section>
          </section>

          {/* Main Content Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
            {/* Right Column - Projects List (moved first for mobile) */}
            <section className="lg:col-span-2 order-1 lg:order-2">
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
                <section className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {filteredProjects.map((project) => {
                    const availableFunds = (project.availableFunds || 0);
                    const usedFunds = (project.usedFunds || 0);
                    const totalFunds = availableFunds + usedFunds;
                    const usedPercentage = totalFunds > 0 ? (usedFunds / totalFunds * 100) : 0;
                    
                    return (
                      <section 
                        key={project.id} 
                        className="p-5 border border-gray-100 rounded-lg hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <h3 className="text-lg font-medium">{project.title}</h3>
                          <p className="text-xs sm:text-sm px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full self-start whitespace-nowrap">
                            {project.status || 'In Progress'}
                          </p>
                        </section>
                        
                        <section className="flex justify-between items-center gap-4">
                          <section className="space-y-2">
                            <section className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">Available:</p>
                              <p className="font-medium">{formatCurrency(availableFunds)}</p>
                            </section>
                            
                            <section className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">Used:</p>
                              <p className="font-medium">{formatCurrency(project.usedFunds || 0)}</p>
                            </section>
                          </section>

                          <section className="flex-1 max-w-xs">
                            <section className="w-full bg-gray-200 rounded-full h-2">
                              <section 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${usedPercentage}%` }}
                              />
                            </section>
                            <p className="text-xs text-gray-500 text-right mt-1">
                              {usedPercentage.toFixed(1)}% utilized
                            </p>
                          </section>
                        </section>
                      </section>
                    );
                  })}
                </section>
              </section>
            </section>

            {/* Left Column - Funding Cards */}
            <section className="lg:col-span-1 space-y-6 order-2 lg:order-1">
              {/* Funding Opportunities Card */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FaPiggyBank className="text-pink-500 mr-2" size={24} />
                  Need Funding?
                </h2>

                <section className="space-y-4 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {fundingLoading ? (
                    // Loading state
                    [...Array(2)].map((_, i) => (
                      <section key={i} className="p-4 border border-gray-100 rounded-lg">
                        <section className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                        <section className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                        <section className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-2" />
                      </section>
                    ))
                  ) : fundingOpportunities.length > 0 ? (
                    // Display actual funding opportunities
                    fundingOpportunities.map((opportunity) => (
                      <section 
                        key={opportunity.id}
                        className={`p-6 border rounded-lg transition-colors ${
                          opportunity.status === 'active' ? 'bg-white hover:bg-blue-50 border-gray-200' :
                          opportunity.status === 'closed' ? 'bg-gray-50 border-gray-200' :
                          'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{opportunity.funding_name || 'Funding Opportunity'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            opportunity.status === 'active' ? 'bg-green-100 text-green-800' :
                            opportunity.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {opportunity.status === 'active' ? 'Active' :
                             opportunity.status === 'closed' ? 'Closed' :
                             'Coming Soon'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Amount Available</p>
                            <p className="text-lg font-semibold text-gray-900">
                              R {opportunity.expected_funds?.toLocaleString() || 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Category</p>
                            <p className="text-gray-900 capitalize">
                              {opportunity.category?.replace('_', ' ') || 'General'}
                            </p>
                          </div>
                        </div>

                        {opportunity.description && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                            <p className="text-gray-700 text-sm">{opportunity.description}</p>
                          </div>
                        )}

                        {opportunity.eligibility && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Eligibility</p>
                            <p className="text-gray-700 text-sm">{opportunity.eligibility}</p>
                          </div>
                        )}

                        {opportunity.deadline && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-1">Application Deadline</p>
                            <p className="text-gray-700">
                              {new Date(opportunity.deadline).toLocaleDateString('en-ZA', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}

                        {opportunity.external_link && opportunity.status === 'active' && (
                          <button 
                            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            onClick={() => {
                              window.open(opportunity.external_link, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            Apply Now
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                              />
                            </svg>
                          </button>
                        )}
                      </section>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-4 text-center">
                      No funding opportunities available at the moment.
                    </p>
                  )}
                </section>
              </section>
            </section>
          </section>
        </section>
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </div>
  );
}