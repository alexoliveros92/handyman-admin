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
//  - Extra categories the handyman declared (item B), each with Revoke
//    (opens RevokeCategoryModal requiring a reason) or Reinstate
//  - 6b(c): Suspend an approved handyman (SuspendModal; the backend refuses
//    while a job is in progress or money is pending) and lists the customers
//    to email; Reactivate a suspended one. Rejection is final (documents
//    deleted), so there is no "Approve now" for rejected handymen.
//
// After approve or reject, the component updates local state to reflect
// the new status — the admin sees the change immediately without
// navigating away.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import RejectModal from '../components/RejectModal.jsx';
import RevokeCategoryModal from '../components/RevokeCategoryModal.jsx';
import SuspendModal from '../components/SuspendModal.jsx';
import {
  fetchHandyman, approveHandyman, rejectHandyman,
  suspendHandyman, reactivateHandyman,
  revokeExtraCategory, reinstateExtraCategory,
} from '../services/api.js';
import { formatHandymanRate, CATEGORY_LABELS, CROSS_CATEGORY_IDS } from '../utils/formatters.js';

const DOCUMENT_TYPE_LABELS = {
  national_id:             'National ID / Passport',
  cv:                      'CV',
  certificate:             'Certificate',
  other:                   'Other document',
  antecedentes_policiacos: 'Antecedentes Policiacos',
  antecedentes_penales:    'Antecedentes Penales',
  rtu:                     'Constancia del RTU',
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
  const [revokeTarget, setRevokeTarget]       = useState(null); // category_id being revoked
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [affected, setAffected]               = useState(null); // customers to email after a suspension
  const [retryRejectReason, setRetryRejectReason] = useState(null); // set when the document files weren't removed

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
      setHandyman((prev) => ({ ...prev, status: 'rejected', rejection_reason: reason, documents: [] }));
      setShowRejectModal(false);
      setRetryRejectReason(null);
      setActionMessage('Application rejected and their documents deleted. The reason will be shown to the applicant.');
    } catch (err) {
      if (err.code === 'DOCUMENTS_NOT_REMOVED') {
        // The rejection itself went through; only the files are left.
        setHandyman((prev) => ({ ...prev, status: 'rejected', rejection_reason: reason, documents: [] }));
        setShowRejectModal(false);
        setRetryRejectReason(reason);
      }
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // ── Suspend / reactivate (6b(c)) ───────────────────────────────────────────
  const handleSuspend = async (reason) => {
    setActing(true);
    try {
      const result = await suspendHandyman(id, reason);
      setHandyman((prev) => ({
        ...prev, status: 'suspended', suspension_reason: reason, suspended_at: new Date().toISOString(),
      }));
      setShowSuspendModal(false);
      setAffected(result.affected || []);
      setActionMessage(
        'Handyman suspended. No push was sent: email the reason to the handyman and the affected customers below.'
      );
    } catch (err) {
      setShowSuspendModal(false);
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(
      'Reactivate this handyman? They become visible and bookable again with their current prices. ' +
      'Bookings cancelled by the suspension stay cancelled.'
    )) return;

    setActing(true);
    try {
      await reactivateHandyman(id);
      setHandyman((prev) => ({ ...prev, status: 'approved', suspension_reason: null, suspended_at: null }));
      setAffected(null);
      setActionMessage('Handyman reactivated. Let them know by email.');
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // ── Extra categories (item B) ──────────────────────────────────────────────
  const updateExtraCategory = (categoryId, changes) => {
    setHandyman((prev) => ({
      ...prev,
      extra_categories: (prev.extra_categories || []).map((e) =>
        e.category_id === categoryId ? { ...e, ...changes } : e
      ),
    }));
  };

  const handleRevoke = async (reason) => {
    const categoryId = revokeTarget;
    setActing(true);
    try {
      const { deactivatedPrices } = await revokeExtraCategory(id, categoryId, reason);
      updateExtraCategory(categoryId, { revoked_at: new Date().toISOString(), revoked_reason: reason });
      setRevokeTarget(null);
      setActionMessage(
        `${CATEGORY_LABELS[categoryId]} revoked. ${deactivatedPrices} price(s) switched off; ` +
        'existing bookings are unchanged. The handyman has been notified.'
      );
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const handleReinstate = async (categoryId) => {
    const label = CATEGORY_LABELS[categoryId];
    if (!window.confirm(
      `Reinstate ${label}? The handyman can offer it again, but their prices stay hidden ` +
      'until they save them again in Mis Precios.'
    )) return;

    setActing(true);
    try {
      await reinstateExtraCategory(id, categoryId);
      updateExtraCategory(categoryId, { revoked_at: null, revoked_reason: null });
      setActionMessage(`${label} reinstated. The handyman has been notified to re-enter their prices.`);
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
          status, created_at, rejection_reason, documents = [],
          extra_categories = [], suspension_reason, suspended_at } = handyman;
  const name     = profile?.full_name || 'Unknown';
  const isPending = status === 'pending';
  // 6b(a): accepted at sign-up (Terms §7, §11); the backend refuses to approve without it.
  const conductAccepted = !!profile?.conduct_accepted_at;

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
                  disabled={acting || !conductAccepted}
                  title={conductAccepted ? undefined : 'Conduct commitment not accepted'}
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

            {/* 6b(c): suspend an approved handyman */}
            {status === 'approved' && (
              <button
                onClick={() => setShowSuspendModal(true)}
                disabled={acting}
                className="px-4 py-2 border border-orange-200 text-orange-700 text-sm font-medium
                           rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                Suspend
              </button>
            )}

            {status === 'suspended' && (
              <button
                onClick={handleReactivate}
                disabled={acting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                           rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {acting ? 'Reactivating…' : 'Reactivate'}
              </button>
            )}

            {/* Rejected but the document files are still there: retry the clean-up */}
            {status === 'rejected' && retryRejectReason && (
              <button
                onClick={() => handleReject(retryRejectReason)}
                disabled={acting}
                className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium
                           rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {acting ? 'Retrying…' : 'Retry document deletion'}
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
            <div className="flex items-center gap-3 text-sm">
              <span className="w-24 text-gray-400 flex-shrink-0">Conduct</span>
              {conductAccepted ? (
                <span className="text-gray-900">
                  Accepted {formatDate(profile.conduct_accepted_at)}
                  {profile.conduct_terms_version ? ` (${profile.conduct_terms_version})` : ''}
                </span>
              ) : (
                <span className="text-red-600 font-medium">Not accepted at sign-up: cannot be approved</span>
              )}
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

        {/* Suspension details (6b(c)) */}
        {status === 'suspended' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-orange-800 mb-1.5">
              Suspended {formatDate(suspended_at)}
            </h2>
            <p className="text-sm text-orange-700 leading-relaxed whitespace-pre-line">
              {suspension_reason || '—'}
            </p>
            <p className="text-xs text-orange-600 mt-2">
              Admin-only. For a permanent ban, delete the account (removes the documents).
            </p>
          </div>
        )}

        {/* Customers to email after a suspension (6b(c)) */}
        {affected && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Customers to email</h2>
            <p className="text-xs text-gray-400 mb-4">
              Their bookings / quote requests with this handyman were cancelled. Only shown now; copy it before leaving the page.
            </p>
            {affected.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing was open: no customer is affected.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="font-normal pb-2">Customer</th>
                    <th className="font-normal pb-2">Email</th>
                    <th className="font-normal pb-2">What</th>
                    <th className="font-normal pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {affected.map((a) => (
                    <tr key={`${a.kind}-${a.id}`}>
                      <td className="py-2 text-gray-900">{a.full_name || '—'}</td>
                      <td className="py-2 text-gray-700 select-all">{a.email || '—'}</td>
                      <td className="py-2 text-gray-500">{a.kind === 'booking' ? 'Booking' : 'Quote request'}</td>
                      <td className="py-2 text-gray-500">{a.job_date ? formatShortDate(a.job_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Extra categories (item B) — gardening handymen can't have any */}
        {CROSS_CATEGORY_IDS.includes(category_id) && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Extra categories</h2>
            <p className="text-xs text-gray-400 mb-4">
              Categories this handyman also offers, declared in Mis Precios. Their main
              category stays {CATEGORY_LABELS[category_id]}.
            </p>

            {extra_categories.length === 0 ? (
              <p className="text-sm text-gray-400">No extra categories declared.</p>
            ) : (
              <div className="space-y-3">
                {extra_categories.map((e) => (
                  <ExtraCategoryRow
                    key={e.category_id}
                    extra={e}
                    acting={acting}
                    onRevoke={() => setRevokeTarget(e.category_id)}
                    onReinstate={() => handleReinstate(e.category_id)}
                  />
                ))}
              </div>
            )}
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

      {/* Suspend modal (6b(c)) */}
      {showSuspendModal && (
        <SuspendModal
          handymanName={name}
          onConfirm={handleSuspend}
          onCancel={() => setShowSuspendModal(false)}
          loading={acting}
        />
      )}

      {/* Revoke extra category modal */}
      {revokeTarget && (
        <RevokeCategoryModal
          handymanName={name}
          categoryLabel={CATEGORY_LABELS[revokeTarget] || revokeTarget}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
          loading={acting}
        />
      )}
    </Layout>
  );
}

// ── ExtraCategoryRow sub-component ────────────────────────────────────────────
// One declared extra category: declared date and declaration version, status,
// and the Revoke / Reinstate action.

function ExtraCategoryRow({ extra, acting, onRevoke, onReinstate }) {
  const { category_id, declared_at, declaration_version, revoked_at, revoked_reason } = extra;
  const isRevoked = !!revoked_at;

  return (
    <div className={`flex items-start gap-4 p-3.5 border rounded-xl ${
      isRevoked ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800">{CATEGORY_LABELS[category_id] || category_id}</p>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isRevoked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {isRevoked ? 'Revoked' : 'Active'}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Declared {formatShortDate(declared_at)} · declaration {declaration_version || '—'}
        </p>
        {isRevoked && (
          <p className="text-xs text-red-600 mt-1">
            Revoked {formatShortDate(revoked_at)}{revoked_reason ? `: ${revoked_reason}` : ''}
          </p>
        )}
      </div>

      {isRevoked ? (
        <button
          onClick={onReinstate}
          disabled={acting}
          className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-700
                     rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Reinstate
        </button>
      ) : (
        <button
          onClick={onRevoke}
          disabled={acting}
          className="px-3 py-1.5 border border-red-200 text-xs font-medium text-red-600
                     rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Revoke
        </button>
      )}
    </div>
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