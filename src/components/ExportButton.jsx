import { useState } from 'react';
import { handleDashboardExport } from '../backend/firebase/csv_report';
import { auth } from '../backend/firebase/firebaseConfig';

export default function ExportButton({ type, label }) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleExport = async (format) => {
    try {
      setLoading(true);
      await handleDashboardExport(auth.currentUser.uid, type, format);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="text-sm text-gray-600 flex items-center hover:text-blue-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {loading ? 'Exporting...' : label || 'Export'}
      </button>
      
      {showOptions && (
        <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <button
            onClick={() => handleExport('csv')}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}