// src/components/StatusBadge.jsx
// Colored pill component for pending / approved / rejected status.
// Used in HandymanCard and HandymanDetailPage.

const CONFIG = {
  pending:  { label: 'Pending review', classes: 'bg-amber-50 text-amber-700 ring-amber-200' },
  approved: { label: 'Approved',       classes: 'bg-green-50 text-green-700 ring-green-200' },
  rejected: { label: 'Rejected',       classes: 'bg-red-50 text-red-700 ring-red-200' },
};

export default function StatusBadge({ status }) {
  const { label, classes } = CONFIG[status] || CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${classes}`}>
      {label}
    </span>
  );
}