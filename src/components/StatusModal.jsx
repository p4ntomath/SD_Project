import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusModal = ({ isOpen, onClose, success, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 m-2 bg-opacity-40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h2 className={`text-xl font-semibold mb-4 ${success ? 'text-green-600' : 'text-red-600'}`}>
              {success ? 'Success' : 'Error'}
            </h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusModal;
