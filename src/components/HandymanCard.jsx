// src/components/HandymanCard.jsx
// Compact card for the list view. Shows the key facts an admin needs
// at a glance before deciding which applicant to open first.

import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { formatHandymanRate } from '../utils/formatters.js';

// Human-readable trade labels
const CATEGORY_LABELS = {
  plumbing:     'Plumbing',
  electrician:  'Electrician',
  construction: 'Construction',
  smithy:       'Smithy',
  gardening:    'Gardening',
};

// Category accent colours for the icon column
const CATEGORY_COLORS = {
  plumbing:     'bg-blue-100 text-blue-600',
  electrician:  'bg-amber-100 text-amber-600',
  construction: 'bg-purple-100 text-purple-600',
  smithy:       'bg-red-100 text-red-600',
  gardening:    'bg-green-100 text-green-600',
};

// Category initials used inside the icon
const CATEGORY_INITIALS = {
  plumbing:     'PL',
  electrician:  'EL',
  construction: 'CO',
  smithy:       'SM',
  gardening:    'GD',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export default function HandymanCard({ handyman }) {
  const navigate = useNavigate();
  const { id, category_id, hourly_rate, years_experience, city, status, created_at, profile } = handyman;
  const name     = profile?.full_name || 'Unknown';
  const initials = CATEGORY_INITIALS[category_id] || '??';
  const color    = CATEGORY_COLORS[category_id]    || 'bg-gray-100 text-gray-600';

  return (
    <div
      onClick={() => navigate(`/handymen/detail/${id}`)}
      className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4
                 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
    >
      {/* Trade icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="text-sm font-bold">{initials}</span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-gray-500">
          {CATEGORY_LABELS[category_id] || category_id}
          {city ? ` · ${city}` : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 flex-shrink-0 text-right">
        <div>
          <p className="text-sm font-semibold text-gray-900">{formatHandymanRate(hourly_rate, category_id)}</p>
          <p className="text-xs text-gray-400">{hourly_rate != null ? 'Hourly rate' : 'Pricing'}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{years_experience ?? 0}yr</p>
          <p className="text-xs text-gray-400">Experience</p>
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-gray-900">{formatDate(created_at)}</p>
          <p className="text-xs text-gray-400">Applied</p>
        </div>
        {/* Arrow */}
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}