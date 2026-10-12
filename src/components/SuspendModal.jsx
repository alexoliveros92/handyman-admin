// src/components/SuspendModal.jsx
// 6b(c): collects the suspension reason before suspending an approved
// handyman. The reason stays admin-only (the admin team emails it); nothing
// is pushed to anyone. Blockers (job in progress, unpaid payouts, failed
// payment) are reported by the backend and shown on the detail page.

import { useState } from 'react';

const MIN_LENGTH = 10;

export default function SuspendModal({ handymanName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= MIN_LENGTH;

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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Suspend handyman</h2>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{handymanName}</span> is suspended immediately:
        </p>
        <ul className="text-xs text-gray-600 leading-relaxed list-disc pl-5 mb-5 space-y-1">
          <li>Hidden from customers and cannot be booked.</li>
          <li>Their pending and confirmed bookings, open quote requests and pending job-type requests are cancelled. No card is charged.</li>
          <li>No push is sent to anyone. Email the reason to the handyman, and the affected customers (listed after you confirm).</li>
          <li>Reversible: Reactivate from this page. Documents are kept.</li>
        </ul>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Reason (admin only, not shown in the app)
        </label>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Customer report of threats on booking 12 Oct, verified with the chat."
          autoFocus
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     placeholder:text-gray-400"
        />

        <div className="flex items-center justify-between mt-1 mb-5">
          <p className={`text-xs ${reason.trim().length < MIN_LENGTH ? 'text-gray-400' : 'text-green-600'}`}>
            {reason.trim().length}/{MIN_LENGTH} characters minimum
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
            className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Suspending…' : 'Confirm suspension'}
          </button>
        </div>
      </div>
    </div>
  );
}
