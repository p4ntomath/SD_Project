import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusModal = ({ isOpen, onClose, success, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <section className="fixed inset-0 z-50 overflow-y-auto">
        <section className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <section className="flex items-center justify-center min-h-screen p-4">
          <motion.article
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
          >
            <header className="flex items-center mb-4">
              <figure className={`p-2 rounded-full ${success ? 'bg-green-100' : 'bg-red-100'} mr-3`}>
                {success ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </figure>
              <h2 className="text-xl font-semibold text-gray-900">
                {success ? 'Success' : 'Error'}
              </h2>
            </header>
            
            <section className="mb-6">
              <p className="text-gray-700">{message}</p>
            </section>

            <footer className="flex justify-end">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl ${success ? 'bg-green-600' : 'bg-red-600'} text-white hover:bg-opacity-90 transition-colors`}
              >
                Close
              </button>
            </footer>
          </motion.article>
        </section>
      </section>
    </AnimatePresence>
  );
};

export default StatusModal;
