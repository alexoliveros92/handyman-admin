// src/pages/PayoutsPage.jsx
// Manual payout tracking (Option B).
//
// No money moves automatically here. The founder reviews what each handyman
// is owed for completed bookings, sends the transfer manually outside the
// app (Recurrente's own transfer tools, direct bank transfer, etc.), then
// marks the relevant bookings as paid so they drop off this list.
//
// Two tabs: "Pending" (what's currently owed, grouped by handyman, with
// bank details alongside so the transfer can be sent without a second
// lookup) and "History" (already-paid bookings, for record-keeping).

import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { fetchPendingPayouts, markPayoutsPaid, fetchPayoutHistory } from '../services/api.js';
import { formatPrice } from '../utils/formatters.js';
import { useAdminAuth } from '../context/AuthContext.jsx';

const ACCOUNT_TYPE_LABELS = {
  monetaria: 'Monetaria (checking)',
  ahorro:    'Ahorro (savings)',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export default function PayoutsPage() {
  const { logout } = useAdminAuth();

  const [tab, setTab] = useState('pending'); // 'pending' | 'history'

  const [payouts, setPayouts] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState({}); // { [handymanId]: Set<bookingId> }

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [marking, setMarking] = useState(null); // handymanId currently being submitted
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const request = tab === 'pending'
      ? fetchPendingPayouts().then(({ payouts: data }) => setPayouts(data || []))
      : fetchPayoutHistory().then(({ history: data }) => setHistory(data || []));

    request
      .catch((err) => {
        if (err.status === 401) logout();
        else setError(err.message || 'Failed to load payouts.');
      })
      .finally(() => setLoading(false));

  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleBooking = (handymanId, bookingId) => {
    setSelected((prev) => {
      const next = new Set(prev[handymanId] || []);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return { ...prev, [handymanId]: next };
    });
  };

  const toggleSelectAll = (handymanId, bookingIds) => {
    setSelected((prev) => {
      const current = prev[handymanId] || new Set();
      const allSelected = bookingIds.length > 0 && bookingIds.every((id) => current.has(id));
      return { ...prev, [handymanId]: allSelected ? new Set() : new Set(bookingIds) };
    });
  };

  // ── Mark as paid ──────────────────────────────────────────────────────────
  const handleMarkPaid = async (handymanId) => {
    const bookingIds = Array.from(selected[handymanId] || []);
    if (bookingIds.length === 0 || marking) return;

    setMarking(handymanId);
    setMessage(null);
    try {
      await markPayoutsPaid(handymanId, bookingIds);

      // Remove the now-paid bookings locally; drop the handyman group
      // entirely once nothing pending remains for them.
      setPayouts((prev) => prev
        .map((p) => {
          if (p.handymanId !== handymanId) return p;
          const remaining = p.bookings.filter((b) => !bookingIds.includes(b.id));
          const paidAmount = p.bookings
            .filter((b) => bookingIds.includes(b.id))
            .reduce((sum, b) => sum + parseFloat(b.subtotal), 0);
          return {
            ...p,
            bookings: remaining,
            bookingCount: remaining.length,
            totalOwed: p.totalOwed - paidAmount,
          };
        })
        .filter((p) => p.bookings.length > 0));

      setSelected((prev) => {
        const next = { ...prev };
        delete next[handymanId];
        return next;
      });

      setMessage(`Marked ${bookingIds.length} booking${bookingIds.length === 1 ? '' : 's'} as paid.`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setMarking(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track what every handyman is owed and mark bookings as paid once you've sent the transfer.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'history', label: 'History' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Result message */}
        {message && (
          <div className={`rounded-xl p-4 mb-6 text-sm font-medium border ${
            message.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            <p className="font-semibold mb-1">Could not load payouts</p>
            <p>{error}</p>
          </div>
        )}

        {/* Pending tab */}
        {!loading && !error && tab === 'pending' && (
          payouts.length === 0 ? (
            <EmptyState message="No pending payouts. Every completed booking has been paid out." />
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <PayoutGroupCard
                  key={payout.handymanId}
                  payout={payout}
                  selectedIds={selected[payout.handymanId] || new Set()}
                  onToggleBooking={toggleBooking}
                  onToggleSelectAll={toggleSelectAll}
                  onMarkPaid={handleMarkPaid}
                  marking={marking === payout.handymanId}
                />
              ))}
            </div>
          )
        )}

        {/* History tab */}
        {!loading && !error && tab === 'history' && (
          history.length === 0 ? (
            <EmptyState message="No payouts have been marked as paid yet." />
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Handyman</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Paid on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-5 py-3.5 text-gray-900 font-medium">
                        {booking.handyman?.profile?.full_name || 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{formatPrice(booking.subtotal)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(booking.payout_sent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

      </div>
    </Layout>
  );
}

// ── EmptyState sub-component ────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 9V7a4 4 0 00-8 0v2M5 9h14l-1 11H6L5 9z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}

// ── PayoutGroupCard sub-component ───────────────────────────────────────────
// One handyman's pending payout: totals, bank details for the transfer,
// and a checklist of bookings to select before marking paid.

function PayoutGroupCard({ payout, selectedIds, onToggleBooking, onToggleSelectAll, onMarkPaid, marking }) {
  const { handymanId, handymanName, bankDetails, totalOwed, bookingCount, bookings } = payout;
  const bookingIds = bookings.map((b) => b.id);
  const allSelected = bookingIds.length > 0 && bookingIds.every((id) => selectedIds.has(id));
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">

      {/* Header: name + totals */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">{handymanName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'} pending payout
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total owed</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(totalOwed)}</p>
        </div>
      </div>

      {/* Bank details */}
      {bankDetails ? (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-gray-400">Bank</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{bankDetails.bank_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Account type</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {ACCOUNT_TYPE_LABELS[bankDetails.account_type] || bankDetails.account_type}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Account number</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{bankDetails.account_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Account holder</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{bankDetails.account_holder_name}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-700">
          No bank details on file yet — the handyman hasn't added them from the mobile app.
        </div>
      )}

      {/* Booking checklist */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleSelectAll(handymanId, bookingIds)}
            className="w-4 h-4 rounded accent-primary-600"
          />
          <span className="text-xs font-medium text-gray-500">Select all</span>
        </div>
        <div className="divide-y divide-gray-100">
          {bookings.map((booking) => (
            <label
              key={booking.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(booking.id)}
                onChange={() => onToggleBooking(handymanId, booking.id)}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <span className="flex-1 text-gray-500">Completed {formatDate(booking.completedAt)}</span>
              <span className="font-medium text-gray-900">{formatPrice(booking.subtotal)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mark as paid */}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => onMarkPaid(handymanId)}
          disabled={!hasSelection || marking}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold
                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {marking && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Mark as paid{hasSelection ? ` (${selectedIds.size})` : ''}
        </button>
      </div>
    </div>
  );
}
