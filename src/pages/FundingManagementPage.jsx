import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
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
    externalLink: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      if (showEditModal) {
        await updateFunding(currentFunding.id, formData);
        setSuccess("Funding opportunity updated successfully");
      } else {
        await createFunding(formData);
        setSuccess("Funding opportunity created successfully");
      }
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

  const handleDelete = async () => {
    try {
      await deleteFunding(fundingToDelete.id);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <MainNav setMobileMenuOpen={setMobileMenuOpen} mobileMenuOpen={mobileMenuOpen} />
      </header>

      <main className="p-4 md:p-8 pb-16 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft size={24} />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Funding Opportunities</h1>
            </div>
            <button
              onClick={() => {
                setCurrentFunding(null);
                setFormData({ name: '', expectedFunds: '', externalLink: '' });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              Add New
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <ClipLoader color="#3B82F6" />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Funds</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">External Link</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fundings.map((funding) => (
                      <tr key={funding.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{funding.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">R{funding.expectedFunds}</div>
                        </td>
                        <td className="px-6 py-4">
                          <a 
                            href={funding.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            {funding.externalLink}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setCurrentFunding(funding);
                              setFormData({
                                name: funding.name,
                                expectedFunds: funding.expectedFunds,
                                externalLink: funding.externalLink
                              });
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
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
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm transition-all" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {showEditModal ? 'Edit Funding Opportunity' : 'Add New Funding Opportunity'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Funds (R)</label>
                      <input
                        type="number"
                        value={formData.expectedFunds}
                        onChange={(e) => setFormData({ ...formData, expectedFunds: e.target.value })}
                        className="mt-1 block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
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
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm transition-all" onClick={() => setShowDeleteConfirm(false)} />
              <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete "{fundingToDelete?.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        <StatusModal
          isOpen={showStatus}
          onClose={() => setShowStatus(false)}
          success={!error}
          message={error || success}
        />
      </main>

      <footer>
        <MobileBottomNav />
      </footer>
    </div>
  );
}