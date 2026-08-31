// src/components/JobTypeRequestCard.jsx
// Card for one pending job type request. Unlike HandymanCard, this doesn't
// navigate to a detail page — the approve/reject actions are handled inline
// via modals owned by the parent page.

const CATEGORY_LABELS = {
  plumbing:     'Plomería',
  electrician:  'Electricidad',
  construction: 'Construcción',
  smithy:       'Herrería',
  gardening:    'Jardinería',
};

const CATEGORY_COLORS = {
  plumbing:     'bg-blue-100 text-blue-600',
  electrician:  'bg-amber-100 text-amber-600',
  construction: 'bg-purple-100 text-purple-600',
  smithy:       'bg-red-100 text-red-600',
  gardening:    'bg-green-100 text-green-600',
};

const CATEGORY_INITIALS = {
  plumbing:     'PL',
  electrician:  'EL',
  construction: 'CO',
  smithy:       'SM',
  gardening:    'GD',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-GT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export default function JobTypeRequestCard({ request, onApprove, onReject, acting }) {
  const { category_id, proposed_name, proposed_description, created_at, handyman } = request;
  const handymanName = handyman?.profile?.full_name || 'Desconocido';
  const initials = CATEGORY_INITIALS[category_id] || '??';
  const color    = CATEGORY_COLORS[category_id]    || 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <span className="text-sm font-bold">{initials}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-gray-900">{handymanName}</p>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{CATEGORY_LABELS[category_id] || category_id}</span>
          </div>
          <p className="text-base font-semibold text-primary-700 mb-1">{proposed_name}</p>
          {proposed_description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-2">{proposed_description}</p>
          )}
          <p className="text-xs text-gray-400">Solicitado el {formatDate(created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 flex-shrink-0">
          <button
            onClick={() => onReject(request)}
            disabled={acting}
            className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium
                       rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => onApprove(request)}
            disabled={acting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                       rounded-lg transition-colors disabled:opacity-50"
          >
            Aprobar
          </button>
        </div>
      </div>
    </div>
  );
}
