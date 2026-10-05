// src/components/ApproveJobTypeModal.jsx
// Modal dialog for approving a job type request. Pre-fills the handyman's
// proposed name/description, editable before confirming — the admin may
// want to clean up wording before it becomes a real job_types row.
//
// The admin can also move the new job type to another of the 4 cross
// categories (item B). Gardening requests can't be moved, so the dropdown is
// hidden for them (the backend refuses it too).

import { useState } from 'react';
import { CATEGORY_LABELS, CROSS_CATEGORY_IDS } from '../utils/formatters.js';

export default function ApproveJobTypeModal({ request, handymanName, onConfirm, onCancel, loading }) {
  const [name, setName] = useState(request.proposed_name || '');
  const [description, setDescription] = useState(request.proposed_description || '');
  const [categoryId, setCategoryId] = useState(request.category_id);
  const canChangeCategory = CROSS_CATEGORY_IDS.includes(request.category_id);
  const isValid = name.trim().length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    // Only send a category when it was actually changed.
    const movedTo = canChangeCategory && categoryId !== request.category_id ? categoryId : null;
    onConfirm(name.trim(), description.trim() || null, movedTo);
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Aprobar servicio</h2>
        <p className="text-sm text-gray-500 mb-5">
          Revisa y ajusta si es necesario el nombre y la descripción propuestos por{' '}
          <span className="font-medium text-gray-700">{handymanName}</span>{' '}
          antes de confirmar. Esto creará el nuevo tipo de servicio.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre del servicio
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                     placeholder:text-gray-400 mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Descripción
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción opcional del servicio"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                     placeholder:text-gray-400"
        />

        {canChangeCategory && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 mt-4">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {CROSS_CATEGORY_IDS.map((id) => (
                <option key={id} value={id}>
                  {CATEGORY_LABELS[id]}{id === request.category_id ? ' (solicitada)' : ''}
                </option>
              ))}
            </select>
            {categoryId !== request.category_id && (
              <p className="text-xs text-amber-600 mt-1.5">
                El servicio se creará en {CATEGORY_LABELS[categoryId]}. Si el técnico aún no ofrece esa
                categoría, se le pedirá aceptar la declaración la primera vez que le ponga precio.
              </p>
            )}
          </>
        )}

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
            disabled={!isValid || loading}
            className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Aprobando…' : 'Confirmar aprobación'}
          </button>
        </div>
      </div>
    </div>
  );
}
