// src/components/RejectModal.jsx
// Modal dialog that collects a rejection reason before confirming.
// The reason is shown to the handyman on their rejected screen (Task 7)
// so it must be specific and actionable.

import { useState } from 'react';

export default function RejectModal({ handymanName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 10;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(reason.trim());
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Reject application</h2>
        <p className="text-sm text-gray-500 mb-5">
          Provide a reason that will be shown to{' '}
          <span className="font-medium text-gray-700">{handymanName}</span>{' '}
          so they know what to address before reapplying.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Rejection reason
        </label>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Submitted ID document appears expired. Please provide a valid government-issued ID and reapply."
          autoFocus
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                     placeholder:text-gray-400"
        />

        <div className="flex items-center justify-between mt-1 mb-5">
          <p className={`text-xs ${reason.trim().length < 10 ? 'text-gray-400' : 'text-green-600'}`}>
            {reason.trim().length}/10 characters minimum
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium
                       rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Rejecting…' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}