import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusModal = ({ isOpen, onClose, success, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[9999] backdrop-blur-sm bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200"
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-title"
          >
            <header>
              <h2 
                id="status-title"
                className={`text-xl font-semibold mb-4 ${success ? 'text-green-600/90' : 'text-red-600/90'}`}
              >
                {success ? 'Success' : 'Error'}
              </h2>
            </header>
            <section className="mb-6">
              <div className="text-gray-700">{message}</div>
            </section>
            <footer className="flex justify-end">
              <button
                onClick={onClose}
                className={`${success ? 'bg-green-600/90' : 'bg-red-600/90'} backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:${success ? 'bg-green-700/90' : 'bg-red-700/90'} transition-colors`}
                aria-label="Close modal"
              >
                Close
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusModal;
