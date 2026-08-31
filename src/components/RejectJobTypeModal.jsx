// src/components/RejectJobTypeModal.jsx
// Modal dialog for rejecting a job type request. Unlike RejectModal (for
// handyman applications), the reason here is optional — the backend accepts
// an empty/null reason for job type rejections.

import { useState } from 'react';

export default function RejectJobTypeModal({ handymanName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Rechazar servicio</h2>
        <p className="text-sm text-gray-500 mb-5">
          Puedes añadir un motivo opcional que se mostrará a{' '}
          <span className="font-medium text-gray-700">{handymanName}</span>.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Motivo del rechazo (opcional)
        </label>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="p. ej. Este servicio ya existe en el catálogo bajo otro nombre."
          autoFocus
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                     placeholder:text-gray-400"
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium
                       rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Rechazando…' : 'Confirmar rechazo'}
          </button>
        </div>
      </div>
    </div>
  );
}
