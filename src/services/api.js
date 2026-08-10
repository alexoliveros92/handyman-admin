// src/services/api.js
// Authenticated fetch wrapper for the handyman-backend admin routes.
//
// All requests include 'x-admin-secret' — the header that adminAuth.js
// in the backend checks. No Supabase JWTs, no user sessions — just the
// shared secret set in Railway's environment variables.
//
// The Content-Type header is only sent when a body is present. Sending
// it on body-less POSTs (like /approve) causes Express's json() parser
// to expect a body and throw a 400 error — this was bug #11 in the
// Task 9 testing log.

const BASE_URL = import.meta.env.VITE_API_URL;

// Read the currently-stored admin secret from localStorage directly.
// We don't use the AuthContext here (that's a React concern) — the
// service layer just reads storage and lets the caller handle auth errors.
const getSecret = () => localStorage.getItem('handyman_admin_secret') || '';

const request = async (method, path, body = null) => {
  const headers = {
    'x-admin-secret': getSecret(),
  };

  // Only set Content-Type when a body is being sent
  if (body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(`${BASE_URL}/api${path}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};

// ── Admin handyman operations ─────────────────────────────────────────────────

/**
 * Fetch all handymen with the given status.
 * @param {'pending'|'approved'|'rejected'} status
 */
export const fetchHandymen = (status) =>
  request('GET', `/admin/handymen?status=${status}`);

/**
 * Fetch full details for one handyman, including signed document URLs.
 * @param {string} id — handymen.id (UUID)
 */
export const fetchHandyman = (id) =>
  request('GET', `/admin/handymen/${id}`);

/**
 * Approve a handyman. No body required.
 * @param {string} id
 */
export const approveHandyman = (id) =>
  request('POST', `/admin/handymen/${id}/approve`);

/**
 * Reject a handyman with a mandatory reason.
 * @param {string} id
 * @param {string} reason — at least 10 characters (validated server-side)
 */
export const rejectHandyman = (id, reason) =>
  request('POST', `/admin/handymen/${id}/reject`, { reason });

// ── Admin payout operations (manual payout tracking, Option B) ─────────────

/**
 * Fetch every handyman with at least one 'pending' payout booking,
 * grouped with total owed and bank details.
 */
export const fetchPendingPayouts = () =>
  request('GET', '/admin/payouts');

/**
 * Mark specific bookings as paid for a handyman, once the manual bank
 * transfer has actually been sent outside the app.
 * @param {string} handymanId
 * @param {string[]} bookingIds
 */
export const markPayoutsPaid = (handymanId, bookingIds) =>
  request('POST', `/admin/payouts/${handymanId}/mark-paid`, { bookingIds });

/**
 * Fetch already-paid bookings (most recent first) for the founder's
 * own record-keeping/audit.
 */
export const fetchPayoutHistory = () =>
  request('GET', '/admin/payouts/history');