// src/pages/HandymanListPage.jsx
// Shows all handymen filtered by status (pending / approved / rejected).
// The status comes from the URL parameter — /handymen/pending,
// /handymen/approved, /handymen/rejected — so the browser's back button
// and direct links work correctly.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import HandymanCard from '../components/HandymanCard.jsx';
import { fetchHandymen } from '../services/api.js';
import { useAdminAuth } from '../context/AuthContext.jsx';

const STATUS_LABELS = {
  pending:  'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_DESCRIPTIONS = {
  pending:  'Applicants waiting for your decision.',
  approved: 'Handymen visible in the marketplace.',
  rejected: 'Declined applications.',
};

export default function HandymanListPage() {
  const { status } = useParams(); // 'pending' | 'approved' | 'rejected'
  const { logout } = useAdminAuth();

  const [handymen, setHandymen] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchHandymen(status)
      .then(({ handymen: data }) => setHandymen(data || []))
      .catch((err) => {
        if (err.status === 401) {
          // Wrong admin secret — log out and redirect to login
          logout();
        } else {
          setError(err.message || 'Failed to load applicants.');
        }
      })
      .finally(() => setLoading(false));

  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {STATUS_LABELS[status] || 'Applicants'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {STATUS_DESCRIPTIONS[status] || ''}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            <p className="font-semibold mb-1">Could not load applicants</p>
            <p>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && handymen.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">
              No {STATUS_LABELS[status]?.toLowerCase() || status} applicants
            </p>
          </div>
        )}

        {/* List */}
        {!loading && !error && handymen.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium mb-4">
              {handymen.length} {handymen.length === 1 ? 'applicant' : 'applicants'}
            </p>
            {handymen.map((h) => (
              <HandymanCard key={h.id} handyman={h} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}