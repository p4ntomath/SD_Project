import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusModal = ({ isOpen, onClose, success, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <dialog
          open={isOpen}
          className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <article
            className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl w-full max-w-md m-4 border border-gray-200"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <header>
              <h2 
                id="modal-title"
                className={`text-xl font-semibold mb-4 ${success ? 'text-green-600/90' : 'text-red-600/90'}`}
              >
                {success ? 'Success' : 'Error'}
              </h2>
            </header>
            <section className="mb-6">
              <p className="text-gray-700">{message}</p>
            </section>
            <footer className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-blue-700/90 transition-colors"
                aria-label="Close modal"
              >
                Close
              </button>
            </footer>
          </article>
        </dialog>
      )}
    </AnimatePresence>
  );
};

export default StatusModal;
