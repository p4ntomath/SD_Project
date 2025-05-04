import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllFunding, createFunding, deleteFunding, updateFunding } from '../backend/firebase/adminAccess.jsx';
import StatusModal from '../components/StatusModal';
import { ClipLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';

export default function FundingManagementPage() {
  const [fundingOpportunities, setFundingOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentFunding, setCurrentFunding] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    expectedFunds: '',
    externalLink: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fundingToDelete, setFundingToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFundingOpportunities();
  }, []);

  const loadFundingOpportunities = async () => {
    try {
      setLoading(true);
      const data = await getAllFunding();
      setFundingOpportunities(data);
    } catch (error) {
      console.error('Error loading funding opportunities:', error);
      setStatusMessage('Failed to load funding opportunities');
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      if (showEditModal && currentFunding) {
        await updateFunding(currentFunding.id, formData);
        setStatusMessage('Funding opportunity updated successfully');
      } else {
        await createFunding(formData);
        setStatusMessage('Funding opportunity created successfully');
      }
      setModalOpen(true);
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({ name: '', expectedFunds: '', externalLink: '' });
      loadFundingOpportunities();
    } catch (error) {
      console.error('Error saving funding opportunity:', error);
      setStatusMessage('Failed to save funding opportunity');
      setModalOpen(true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true);
      await deleteFunding(id);
      setStatusMessage('Funding opportunity deleted successfully');
      setModalOpen(true);
      loadFundingOpportunities();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting funding opportunity:', error);
      setStatusMessage('Failed to delete funding opportunity');
      setModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (funding) => {
    setCurrentFunding(funding);
    setFormData({
      name: funding.name,
      expectedFunds: funding.expectedFunds,
      externalLink: funding.externalLink
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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

        {/* Funding List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Funds</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">External Link</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fundingOpportunities.map((funding) => (
                  <tr key={funding.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{funding.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">R {funding.expectedFunds}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={funding.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {funding.externalLink}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(funding)}
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
                      type="text"
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
                        <ClipLoader size={16} color="#FFFFFF" />
                        {showEditModal ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      showEditModal ? 'Update' : 'Add'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && fundingToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !deleteLoading && setShowDeleteConfirm(false)} />
            <motion.article
              className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Delete Funding Opportunity?</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{fundingToDelete.name}"? This action cannot be undone.
              </p>
              <footer className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(fundingToDelete.id)}
                  className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-red-700/90 transition-colors flex items-center justify-center gap-2"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <ClipLoader size={16} color="#FFFFFF" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </footer>
            </motion.article>
          </div>
        )}
      </AnimatePresence>

      <StatusModal
        isOpen={modalOpen}
        message={statusMessage}
        onClose={() => setModalOpen(false)}
        success={true}
      />
    </div>
  );
}