import { useEffect, useState } from 'react';
import { FaPiggyBank, FaArrowLeft, FaSearch, FaBell, FaUserCircle, FaPlus } from 'react-icons/fa';
import { FiBell, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../backend/firebase/projectDB';
import { fetchFunding } from '../backend/firebase/fundingDB';
import { auth } from '../backend/firebase/firebaseConfig';

export default function FundingTrackerPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fundingOpportunities, setFundingOpportunities] = useState([]);
  const [fundingLoading, setFundingLoading] = useState(true);
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
    return sum + available + used;  // Sum of all funds (both available and used)
  }, 0);
  
  const totalUsedFunds = projects.reduce((sum, project) => 
    sum + (project.usedFunds || 0)
  , 0);
  
  const totalAvailableFunds = totalOriginalFunds - totalUsedFunds;
  const utilizationRate = totalOriginalFunds > 0 ? Math.min((totalUsedFunds / totalOriginalFunds) * 100, 100) : 0;
  
  if (loading) {
    return (
      <>
        <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <section className="flex justify-between items-center h-16">
              <section className="flex items-center space-x-4">
                <button
                  data-testid="back-button"
                  onClick={() => navigate(-1)}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FaArrowLeft className="mr-2" />
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
                  Track Funding
                </h1>
              </section>
            </section>

            {/* Center - Search */}
            <section className="flex-1 max-w-xl mx-4 hidden md:block">
              <section className="relative">
                <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </section>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search projects..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </section>
            </section>
          </section>
        </header>

        <main className="min-h-screen bg-gray-50 pt-15 px-4 md:px-8 pb-8">
          <section className="max-w-7xl mx-auto">
            {/* Skeleton Stats Overview */}
            <section className="mb-8 hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <section key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <section className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <section className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </section>
              ))}
            </section>

            {/* Skeleton Main Content */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column Skeleton */}
              <section className="lg:col-span-1 space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <section className="flex items-center mb-4">
                    <section className="w-6 h-6 rounded bg-gray-200 animate-pulse mr-2" />
                    <section className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </section>
                  <section className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <section key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </section>
                </section>
              </section>

              {/* Right Column Skeleton */}
              <section className="lg:col-span-3">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <section className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
                  <section className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <section key={i} className="p-5 border border-gray-100 rounded-lg">
                        <section className="flex justify-between items-start mb-3">
                          <section className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                          <section className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                        </section>
                        <section className="mt-4 h-12 bg-gray-200 rounded animate-pulse" />
                      </section>
                    ))}
                  </section>
                </section>
              </section>
            </section>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {/* AppBar */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="flex justify-between items-center h-16">
            {/* Left side - Logo with back button */}
            <section className="flex items-center space-x-4">
              <button 
                data-testid="back-button"
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
                Track Funding
              </h1>
            </section>

            {/* Center - Search */}
            <section className="flex-1 max-w-xl mx-4 hidden md:block">
              <section className="relative">
                <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </section>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search projects..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </section>
            </section>

            {/* Right side - Actions */}
            <section className="flex items-center space-x-3">
              <button className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                <FiBell className="h-6 w-6 group-hover:text-blue-600" />
              </button>
              
              <button className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                <FiUser className="h-6 w-6 group-hover:text-blue-600" /> 
              </button>
              <p className="text-md text-gray-500">My Profile</p>
            </section>
          </section>
        </section>
      </header>

      <main className="min-h-screen bg-gray-50 pt-15 px-4 md:px-8 pb-8">
        <section className="max-w-7xl mx-auto">

          {/* Stats Overview Banner - Hidden on mobile */}
          <section className="mb-8 hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold">{filteredProjects.length}</p>
            </section>
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100" data-testid="total-available-stats">
              <p className="text-sm text-gray-500">Total Available Funds</p>
              <p className="text-2xl font-bold text-green-600" data-testid="total-available-funds-value">R {totalAvailableFunds.toLocaleString()}</p>
            </section>
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100" data-testid="utilization-rate">
              <p className="text-sm text-gray-500">Utilization Rate</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="utilization-rate-value">
                {utilizationRate.toFixed(1)}%
              </p>
            </section>
          </section>

          {/* Main Content Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-screen">
            {/* Left Column - Funding Cards */}
            <section className="lg:col-span-1 space-y-6">
              {/* Funding Overview Card */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <section className="flex items-center mb-4">
                  <FaPiggyBank className="mr-2 text-pink-500" size={24} />
                  <h2 className="text-lg font-semibold">Funding Overview</h2>
                </section>

                <section className="space-y-4" data-testid="funding-overview">
                  <section className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-600">Total Available Funds</p>
                    <p className="text-xl font-bold">R {totalAvailableFunds.toLocaleString()}</p>
                  </section>
                  
                  <section className="bg-red-50 p-4 rounded-lg">
                    <p className="text-gray-600">Total Used Funds</p>
                    <p className="text-xl font-bold" data-testid="total-used-funds-value">R {totalUsedFunds.toLocaleString()}</p>
                  </section>
                </section>
              </section>
              
              {/* Funding Opportunities Card */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FaPiggyBank className="text-pink-500 mr-2" size={24} />
                  Need Funding?
                </h2>

                <section className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
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
                        className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <h3 className="font-medium">{opportunity.funding_name || 'Funding Opportunity'}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {opportunity.expected_funds ? `Up to R${opportunity.expected_funds} available` : 'Funding available'}
                        </p>
                        
                           {opportunity.external_link && (
                          <button 
                            className="mt-2 text-sm text-blue-600 hover:underline flex items-center"
                            onClick={() => {
                              window.open(opportunity.external_link, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            Apply Here
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 ml-1" 
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
                    // No opportunities available
                    <p className="text-gray-500 text-sm">
                      No funding opportunities available at the moment.
                    </p>
                  )}
                </section>
              </section>
            </section>

            {/* Right Column - Projects List */}
            <section className="lg:col-span-3">
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
                <section className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
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
                              <p className="font-medium">R {availableFunds.toLocaleString()}</p>
                            </section>
                            
                            <section className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">Used:</p>
                              <p className="font-medium">R {(project.usedFunds || 0).toLocaleString()}</p>
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
          </section>
        </section>
      </main>
    </>
  );
}