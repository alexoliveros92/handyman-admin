// src/pages/HandymanDetailPage.jsx
// Full applicant profile for review.
//
// What the admin sees:
//  - Name, trade, city, experience, hourly rate, status badge
//  - Phone number and account registration date
//  - Bio / work description
//  - All uploaded documents as clickable links (signed URLs from the backend)
//  - Approve button (immediate, no modal)
//  - Reject button (opens RejectModal requiring a reason)
//
// After approve or reject, the component updates local state to reflect
// the new status — the admin sees the change immediately without
// navigating away.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import RejectModal from '../components/RejectModal.jsx';
import { fetchHandyman, approveHandyman, rejectHandyman } from '../services/api.js';
import { formatHandymanRate } from '../utils/formatters.js';

const CATEGORY_LABELS = {
  plumbing:     'Plumbing',
  electrician:  'Electrician',
  construction: 'Construction',
  smithy:       'Smithy',
  gardening:    'Gardening',
};

const DOCUMENT_TYPE_LABELS = {
  national_id:  'National ID / Passport',
  cv:           'CV / Work History',
  certificate:  'Certificate',
  other:        'Other document',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

const formatShortDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export default function HandymanDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Action states
  const [acting, setActing]           = useState(false);   // approve/reject in progress
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionMessage, setActionMessage]     = useState(null); // success feedback

  useEffect(() => {
    fetchHandyman(id)
      .then(({ handyman: data }) => setHandyman(data))
      .catch((err) => setError(err.message || 'Failed to load applicant.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (acting) return;
    setActing(true);
    try {
      await approveHandyman(id);
      setHandyman((prev) => ({ ...prev, status: 'approved', rejection_reason: null }));
      setActionMessage('Application approved. This handyman is now visible in the marketplace.');
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async (reason) => {
    setActing(true);
    try {
      await rejectHandyman(id, reason);
      setHandyman((prev) => ({ ...prev, status: 'rejected', rejection_reason: reason }));
      setShowRejectModal(false);
      setActionMessage('Application rejected. The reason has been saved and will be shown to the applicant.');
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-7 h-7 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !handyman) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            {error || 'Applicant not found.'}
          </div>
        </div>
      </Layout>
    );
  }

  const { profile, category_id, bio, hourly_rate, years_experience, city,
          status, created_at, rejection_reason, documents = [] } = handyman;
  const name     = profile?.full_name || 'Unknown';
  const isPending = status === 'pending';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>

        {/* Action result message */}
        {actionMessage && (
          <div className={`rounded-xl p-4 mb-6 text-sm font-medium border ${
            actionMessage.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {actionMessage}
          </div>
        )}

        {/* Profile header card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">{name}</h1>
                <StatusBadge status={status} />
              </div>
              <p className="text-sm text-gray-500">
                {CATEGORY_LABELS[category_id] || category_id}
                {city ? ` · ${city}` : ''}
              </p>
            </div>

            {/* Action buttons — only shown for non-terminal statuses */}
            {isPending && (
              <div className="flex gap-2.5 flex-shrink-0">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={acting}
                  className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium
                             rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                             rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {acting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve
                </button>
              </div>
            )}

            {/* Re-approve option if previously rejected */}
            {status === 'rejected' && (
              <button
                onClick={handleApprove}
                disabled={acting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                           rounded-lg transition-colors disabled:opacity-50"
              >
                {acting ? 'Approving…' : 'Approve now'}
              </button>
            )}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">{hourly_rate != null ? 'Hourly rate' : 'Pricing'}</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">{formatHandymanRate(hourly_rate, category_id)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Experience</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">{years_experience ?? 0} years</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Applied on</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">{formatShortDate(created_at)}</p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Contact information</h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-24 text-gray-400 flex-shrink-0">Phone</span>
              <span className="text-gray-900 font-medium">{profile?.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-24 text-gray-400 flex-shrink-0">Registered</span>
              <span className="text-gray-900">{formatDate(profile?.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">About / work description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{bio}</p>
          </div>
        )}

        {/* Rejection reason (if rejected) */}
        {status === 'rejected' && rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-red-700 mb-1.5">Rejection reason on file</h2>
            <p className="text-sm text-red-600 leading-relaxed">{rejection_reason}</p>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Uploaded documents
            <span className="ml-2 text-xs font-normal text-gray-400">
              (links expire after 1 hour — refresh the page to renew them)
            </span>
          </h2>

          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <RejectModal
          handymanName={name}
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          loading={acting}
        />
      )}
    </Layout>
  );
}

// ── DocumentRow sub-component ─────────────────────────────────────────────────
// Renders a single document with type label, filename, and an "Open" link.
// The signedUrl from the backend is a temporary Supabase Storage link.
// Clicking "Open" opens it in a new browser tab.

function DocumentRow({ doc }) {
  const { type, file_name, signedUrl, signedUrlError, uploaded_at } = doc;
  const label      = DOCUMENT_TYPE_LABELS[type] || type;
  const uploadDate = uploaded_at
    ? new Date(uploaded_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="flex items-center gap-4 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
      {/* Document icon */}
      <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label} · Uploaded {uploadDate}</p>
      </div>

      {/* Open link */}
      {signedUrl ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                     text-xs font-medium text-gray-700 rounded-lg hover:bg-gray-50
                     hover:border-gray-300 transition-colors flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          Open
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ) : (
        <span className="text-xs text-red-500 flex-shrink-0">
          {signedUrlError ? 'Link error' : 'No URL'}
        </span>
      )}
    </div>
  );
}