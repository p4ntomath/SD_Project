import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { AnimatePresence } from 'framer-motion';
import { updateProjectFunds, updateProjectExpense, getFundingHistory } from '../../backend/firebase/fundingDB';
import { formatFirebaseDate } from '../../utils/dateUtils';
import { notify } from '../../backend/firebase/notificationsUtil';
import { checkPermission } from '../../utils/permissions';

/**
 * FundingCard Component - Manages project funding operations including:
 * - Adding funds
 * - Adding expenses
 * - Viewing funding history
 */
export default function FundingCard({ 
  projectId, 
  project, 
  setProject, 
  setModalOpen, 
  setError, 
  setStatusMessage 
}) {
  // State management
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showFundingHistory, setShowFundingHistory] = useState(false);
  const [fundingHistory, setFundingHistory] = useState([]);
  const [fundAmount, setFundAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);

  /**
   * Loads funding history from Firebase and sorts by date
   */
  const loadFundingHistory = async () => {
    try {
      const history = await getFundingHistory(projectId);
      setFundingHistory(history.sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds));
    } catch (err) {
      console.error('Error loading funding history:', err);
      setError(err.message);
    }
  };

  /**
   * Handles adding funds to the project
   * @param {Event} e - Form submit event
   */
  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      if (!checkPermission(project, 'canAddFunds')) {
        throw new Error('You do not have permission to add funds');
      }
      
      setAddFundsLoading(true);
      const amount = parseFloat(fundAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!fundingSource.trim()) {
        throw new Error('Please enter a funding source');
      }

      await updateProjectFunds(projectId, amount, fundingSource);
      setProject({
        ...project,
        availableFunds: (project.availableFunds || 0) + amount
      });

      setShowAddFundsModal(false);
      setFundAmount('');
      setFundingSource('');
      setModalOpen(true);
      setError(false);
      setStatusMessage('Funds added successfully');
      loadFundingHistory();

      // Notify user about the added funds
      notify({type: 'Funds Added', projectId, projectTitle: project.title, amount});

    } catch (err) {
      setError(true);
      setModalOpen(true);
      setStatusMessage('Failed to add funds');
    } finally {
      setAddFundsLoading(false);
    }
  };

  /**
   * Handles adding expenses to the project
   * @param {Event} e - Form submit event
   */
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      if (!checkPermission(project, 'canAddFunds')) {
        throw new Error('You do not have permission to add expenses');
      }

      setAddExpenseLoading(true);
      const amount = parseFloat(expenseAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!expenseDescription.trim()) {
        throw new Error('Please enter an expense description');
      }

      if (amount > (project.availableFunds || 0)) {
        throw new Error('Insufficient funds to cover the expense');
      }

      await updateProjectExpense(projectId, amount, expenseDescription);
      setProject({
        ...project,
        usedFunds: (project.usedFunds || 0) + amount,
        availableFunds: (project.availableFunds || 0) - amount
      });
      
      setShowAddExpenseModal(false);
      setExpenseAmount('');
      setExpenseDescription('');
      setModalOpen(true);
      setError(false);
      setStatusMessage('Expense added successfully');

      // Notify user about the added expense
      notify({type: 'Expense Added', projectId, projectTitle: project.title, amount, description: expenseDescription});
      loadFundingHistory();
    } catch (err) {
      setError(true);
      setModalOpen(true);
      setStatusMessage(err.message);
    } finally {
      setAddExpenseLoading(false);
    }
  };
  
  // Load funding history when modal opens
  useEffect(() => {
    if (showFundingHistory) {
      loadFundingHistory();
    }
  }, [showFundingHistory]);

  return (
    <>
     {/* 
        Project Funding Dashboard Card 
        Displays funding summary, utilization, and action buttons
      */}
      <article className="bg-white rounded-lg shadow p-4 sm:p-6">
        {/* Card Header with Title and Total Funds */}
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Project Funding</h2>
          
          {/* Total Funds Display */}
          <section className="text-right" aria-labelledby="total-funds-label">
            <p id="total-funds-label" className="text-sm text-gray-500">Total Funds</p>
            <p className="text-lg font-semibold" aria-live="polite">
              R {((project.availableFunds || 0) + (project.usedFunds || 0)).toLocaleString()}
            </p>
          </section>
        </header>

        {/* Funds Breakdown Section */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          {/* Available Funds Card */}
          <article className="bg-green-50 p-4 rounded-lg" aria-labelledby="available-funds-label">
            <h3 id="available-funds-label" className="text-sm text-gray-600 mb-1">Available</h3>
            <p className="text-xl font-semibold text-green-600">
              R {(project.availableFunds || 0).toLocaleString()}
            </p>
          </article>

          {/* Used Funds Card */}
          <article className="bg-blue-50 p-4 rounded-lg" aria-labelledby="used-funds-label">
            <h3 id="used-funds-label" className="text-sm text-gray-600 mb-1">Used</h3>
            <p className="text-xl font-semibold text-blue-600">
              R {(project.usedFunds || 0).toLocaleString()}
            </p>
          </article>
        </section>

        {/* Utilization Progress Section */}
        <section className="mb-6" aria-labelledby="utilization-label">
          <h3 id="utilization-label" className="sr-only">Funds Utilization</h3>
          <figure className="w-full bg-gray-200 rounded-full h-2">
            {/* Progress bar showing used funds percentage */}
            <section 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              role="progressbar"
              aria-valuenow={((project.usedFunds || 0) / ((project.availableFunds || 0) + (project.usedFunds || 0)) * 100) || 0}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{ 
                width: `${(((project.usedFunds || 0) / ((project.availableFunds || 0) + (project.usedFunds || 0)) * 100) || 0)}%` 
              }}
            />
          </figure>
          <figcaption className="text-sm text-gray-500 mt-2">
            {(((project.usedFunds || 0) / ((project.availableFunds || 0) + (project.usedFunds || 0)) * 100) || 0).toFixed(1)}% utilized
          </figcaption>
        </section>

        {/* Action Buttons */}
        <nav className="grid grid-cols-3 gap-3" aria-label="Funding actions">
          {checkPermission(project, 'canAddFunds') && (
            <>
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                aria-label="Add funds to project"
              >
                Add Funds
              </button>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                aria-label="Add expense to project"
              >
                Add Expense
              </button>
            </>
          )}
          <button
            onClick={() => setShowFundingHistory(true)}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
            aria-label="View funding history"
          >
            View History
          </button>
        </nav>
      </article>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFundsModal && (
          <section className="fixed inset-0 z-50 overflow-y-auto">
            <section className="flex min-h-screen items-center justify-center p-4">
              <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !addFundsLoading && setShowAddFundsModal(false)} />
              <section className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Funds</h2>
                <form onSubmit={handleAddFunds}>
                  <section className="space-y-4">
                    <section>
                      <label className="block text-sm font-medium text-gray-700">Amount (R)</label>
                      <input
                        type="number"
                        aria-label="Amount Add Funds"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </section>
                    <section>
                      <label className="block text-sm font-medium text-gray-700">Source</label>
                      <input
                        type="text"
                        aria-label="Funding Source"
                        value={fundingSource}
                        onChange={(e) => setFundingSource(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </section>
                  </section>
                  <section className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddFundsModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                      disabled={addFundsLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      aria-label="Submit Add Funds"
                      className="bg-blue-600/90 text-white px-4 py-2 rounded-xl hover:bg-blue-700/90 transition-colors flex items-center justify-center disabled:opacity-50"
                      disabled={addFundsLoading}
                    >
                      {addFundsLoading ? (
                        <>
                          <ClipLoader size={16} color="#FFFFFF" className="mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Funds'
                      )}
                    </button>
                  </section>
                </form>
              </section>
            </section>
          </section>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <section className="fixed inset-0 z-50 overflow-y-auto">
            <section className="flex min-h-screen items-center justify-center p-4">
              <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !addExpenseLoading && setShowAddExpenseModal(false)} />
              <section className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Expense</h2>
                <form onSubmit={handleAddExpense}>
                  <section className="space-y-4">
                    <section>
                      <label className="block text-sm font-medium text-gray-700">Amount (R)</label>
                      <input
                        aria-label="Amount"
                        type="number"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </section>
                    <section>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        aria-label="Description"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        className="mt-1 block w-full h-12 px-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </section>
                  </section>
                  <section className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      name="Cancel"
                      onClick={() => setShowAddExpenseModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50/80 transition-colors"
                      disabled={addExpenseLoading}
                    >
                      Cancel
                    </button>
                    <button
                      aria-label="Submit Expense"
                      data-testid="submit-expense"
                      type="submit"
                      className="bg-blue-600/90 text-white px-4 py-2 rounded-xl hover:bg-blue-700/90 transition-colors flex items-center justify-center disabled:opacity-50"
                      disabled={addExpenseLoading}
                    >
                      {addExpenseLoading ? (
                        <>
                          <ClipLoader size={16} color="#FFFFFF" className="mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Expense'
                      )}
                    </button>
                  </section>
                </form>
              </section>
            </section>
          </section>
        )}
      </AnimatePresence>

      {/* Funding History Modal */}
      <AnimatePresence>
        {showFundingHistory && (
          <section className="fixed inset-0 z-50 overflow-y-auto">
            <section className="flex min-h-screen items-center justify-center p-4">
              <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowFundingHistory(false)} />
              <section className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6">
                <header className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Funding History</h2>
                  <button
                    onClick={() => setShowFundingHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </header>
                <section className="max-h-[60vh] overflow-y-auto">
                  <table className="min-w-full sectionide-y sectionide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description/Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white sectionide-y sectionide-gray-200">
                      {fundingHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFirebaseDate(entry.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 break-all">
                            {entry.type === 'expense' ? 'Expense' : 'Income'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {entry.type === 'expense' ? entry.description : entry.source}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.updatedByName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              R {Math.abs(entry.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            R {(entry.totalAfterUpdate || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </section>
            </section>
          </section>
        )}
      </AnimatePresence>
    </>
  );
}