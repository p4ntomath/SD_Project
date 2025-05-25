import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllFunding, createFunding, deleteFunding, updateFunding } from '../backend/firebase/adminAccess.jsx';
import StatusModal from '../components/StatusModal';
import { ClipLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';
import MainNav from '../components/AdminComponents/Navigation/AdminMainNav';
import MobileBottomNav from '../components/AdminComponents/Navigation/AdminMobileBottomNav';

export default function FundingManagementPage() {
  const [fundings, setFundings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentFunding, setCurrentFunding] = useState(null);
  const [fundingToDelete, setFundingToDelete] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    expectedFunds: '',
    externalLink: '',
    deadline: '',
    category: '',
    eligibility: '',
    description: '',
    status: 'active'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredFundings = fundings.filter(funding => {
    const matchesSearch = !searchQuery || 
      funding.funding_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      funding.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || funding.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Load all funding opportunities on mount
    const loadFunding = async () => {
      try {
        const data = await getAllFunding();
        setFundings(data);
      } catch (error) {
        setError("Failed to load funding opportunities");
      } finally {
        setLoading(false);
      }
    };

    loadFunding();
  }, []);

  // Handle add/edit funding form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const fundingData = {
        funding_name: formData.name,
        expected_funds: formData.expectedFunds,
        external_link: formData.externalLink,
        deadline: formData.deadline,
        category: formData.category,
        eligibility: formData.eligibility,
        description: formData.description,
        status: formData.status
      };
      
      if (showEditModal) {
        await updateFunding(currentFunding.id, fundingData);
        setSuccess("Funding opportunity updated successfully");
      } else {
        await createFunding(fundingData);
        setSuccess("Funding opportunity created successfully");
      }
      // Refresh funding list after update/create
      const updatedFundings = await getAllFunding();
      setFundings(updatedFundings);
      setShowAddModal(false);
      setShowEditModal(false);
      setShowStatus(true);
    } catch (error) {
      setError(error.message);
      setShowStatus(true);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle funding deletion
  const handleDelete = async () => {
    try {
      await deleteFunding(fundingToDelete.id);
      // Refresh funding list after deletion
      const updatedFundings = await getAllFunding();
      setFundings(updatedFundings);
      setSuccess("Funding opportunity deleted successfully");
      setShowStatus(true);
    } catch (error) {
      setError(error.message);
      setShowStatus(true);
    }
    setShowDeleteConfirm(false);
  };

  const handleEdit = (funding) => {
    setCurrentFunding(funding);
    setFormData({
      name: funding.funding_name,
      expectedFunds: funding.expected_funds,
      externalLink: funding.external_link,
      deadline: funding.deadline || '',
      category: funding.category || '',
      eligibility: funding.eligibility || '',
      description: funding.description || '',
      status: funding.status || 'active'
    });
    setShowEditModal(true);
  };

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Main navigation bar */}
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <section className="max-w-6xl mx-auto">
          <section className="flex items-center justify-between mb-6">
            <section className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft size={24} />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Funding Opportunities</h1>
            </section>
            <button
              data-testid="add-funding-button"
              onClick={() => {
                setCurrentFunding(null);
                setFormData({
                  name: '',
                  expectedFunds: '',
                  externalLink: '',
                  deadline: '',
                  category: '',
                  eligibility: '',
                  description: '',
                  status: 'active'
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              Add New
            </button>
          </section>

          <section className="flex items-center gap-4 mb-4">
            <section className="relative flex-1">
              <input
                data-testid="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search funding opportunities..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            </section>
            <select
              data-testid="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </section>

          {loading ? (
            <section className="flex justify-center" data-testid="loading-spinner">
              <ClipLoader color="#3B82F6" />
            </section>
          ) : (
            <section className="bg-white rounded-lg shadow-sm overflow-hidden">
              <section className="overflow-x-auto">
                <table className="min-w-full sectionide-y sectionide-gray-200" data-testid="funding-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Funds</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white sectionide-y sectionide-gray-200">
                    {filteredFundings.map((funding) => (
                      <tr key={funding.id} data-testid={`funding-row-${funding.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{funding.funding_name}</div>
                          {funding.description && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                              {funding.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {funding.category?.replace('_', ' ') || 'General'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900" data-testid="funding-amount">
                            R{Number(funding.expected_funds).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {funding.deadline ? new Date(funding.deadline).toLocaleDateString('en-ZA') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            funding.status === 'active' ? 'bg-green-100 text-green-800' :
                            funding.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`} data-testid="funding-status">
                            {funding.status === 'active' ? 'Active' :
                             funding.status === 'closed' ? 'Closed' :
                             'Coming Soon'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            data-testid={`edit-button-${funding.id}`}
                            onClick={() => {
                              handleEdit(funding);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            data-testid={`delete-button-${funding.id}`}
                            onClick={() => {
                              setFundingToDelete(funding);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </section>
          )}
        </section>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <section className="fixed inset-0 z-50 overflow-y-auto">
            <section className="flex min-h-screen items-center justify-center p-4">
              <section className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm transition-all" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }} />
              <section className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6" data-testid="funding-modal">
                <h2 className="text-xl font-semibold mb-4">
                  {showEditModal ? 'Edit Funding Opportunity' : 'Add New Funding Opportunity'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Funding Name</label>
                      <input
                        data-testid="funding-name-input"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expected Funds (R)</label>
                        <input
                          data-testid="funding-amount-input"
                          type="number"
                          value={formData.expectedFunds}
                          onChange={(e) => setFormData({ ...formData, expectedFunds: e.target.value })}
                          className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
                        <input
                          data-testid="funding-deadline-input"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="research_grant">Research Grant</option>
                        <option value="bursary">Bursary</option>
                        <option value="equipment">Equipment Fund</option>
                        <option value="travel">Travel Grant</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Eligibility Criteria</label>
                      <textarea
                        value={formData.eligibility}
                        onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Detailed Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={5}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">External Link</label>
                      <input
                        type="url"
                        value={formData.externalLink}
                        onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />

                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="coming_soon">Coming Soon</option>
                      </select>
                    </div>
                  </div>
                  <section className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      disabled={updateLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      data-testid="submit-button"
                      disabled={updateLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                    >
                      {updateLoading ? (
                        <>
                          <ClipLoader size={16} color="#ffffff" />
                          Processing...
                        </>
                      ) : showEditModal ? (
                        'Save Changes'
                      ) : (
                        'Add Funding'
                      )}
                    </button>
                  </section>
                </form>
              </section>
            </section>
          </section>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <section className="fixed inset-0 z-50 overflow-y-auto" data-testid="delete-modal">
            <section className="flex min-h-screen items-center justify-center p-4">
              <section className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm transition-all" onClick={() => setShowDeleteConfirm(false)} />
              <section className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete "{fundingToDelete?.name}"? This action cannot be undone.
                </p>
                <section className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="confirm-delete-button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Delete
                  </button>
                </section>
              </section>
            </section>
          </section>
        )}

        {/* Status Modal */}
        <StatusModal
          isOpen={showStatus}
          onClose={() => setShowStatus(false)}
          success={!error} 
          message={error || success}
          messageTestId="error-message"
        />
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </section>
  );
}