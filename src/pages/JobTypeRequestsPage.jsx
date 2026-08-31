// src/pages/JobTypeRequestsPage.jsx
// "Solicitudes de Servicios" — pending job types proposed by handymen
// (submitted from MyJobPricesScreen when their category's fixed menu
// doesn't cover a service they offer).
//
// Approve opens a small form pre-filled with the proposed name/description,
// editable before confirming. Reject opens a form with an optional reason.
// Either action removes the request from this pending list.

import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import JobTypeRequestCard from '../components/JobTypeRequestCard.jsx';
import ApproveJobTypeModal from '../components/ApproveJobTypeModal.jsx';
import RejectJobTypeModal from '../components/RejectJobTypeModal.jsx';
import { fetchJobTypeRequests, approveJobTypeRequest, rejectJobTypeRequest } from '../services/api.js';
import { useAdminAuth } from '../context/AuthContext.jsx';

export default function JobTypeRequestsPage() {
  const { logout } = useAdminAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [message, setMessage]   = useState(null);

  // Modal + in-flight state
  const [modal, setModal]   = useState(null); // { type: 'approve'|'reject', request } | null
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchJobTypeRequests('pending')
      .then(({ jobTypeRequests: data }) => setRequests(data || []))
      .catch((err) => {
        if (err.status === 401) {
          logout();
        } else {
          setError(err.message || 'No se pudieron cargar las solicitudes.');
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeRequest = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (finalName, finalDescription) => {
    const { request } = modal;
    setActing(true);
    try {
      await approveJobTypeRequest(request.id, finalName, finalDescription);
      removeRequest(request.id);
      setModal(null);
      setMessage(`"${finalName}" fue aprobado y agregado al catálogo de servicios.`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async (reason) => {
    const { request } = modal;
    setActing(true);
    try {
      await rejectJobTypeRequest(request.id, reason);
      removeRequest(request.id);
      setModal(null);
      setMessage('La solicitud fue rechazada.');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Servicios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tipos de servicio propuestos por los handymen, pendientes de tu revisión.
          </p>
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
            <p className="font-semibold mb-1">No se pudieron cargar las solicitudes</p>
            <p>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">No hay solicitudes pendientes</p>
          </div>
        )}

        {/* List */}
        {!loading && !error && requests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium mb-4">
              {requests.length} {requests.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
            </p>
            {requests.map((r) => (
              <JobTypeRequestCard
                key={r.id}
                request={r}
                onApprove={(request) => setModal({ type: 'approve', request })}
                onReject={(request) => setModal({ type: 'reject', request })}
                acting={acting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approve modal */}
      {modal?.type === 'approve' && (
        <ApproveJobTypeModal
          request={modal.request}
          handymanName={modal.request.handyman?.profile?.full_name || 'Desconocido'}
          onConfirm={handleApprove}
          onCancel={() => setModal(null)}
          loading={acting}
        />
      )}

      {/* Reject modal */}
      {modal?.type === 'reject' && (
        <RejectJobTypeModal
          handymanName={modal.request.handyman?.profile?.full_name || 'Desconocido'}
          onConfirm={handleReject}
          onCancel={() => setModal(null)}
          loading={acting}
        />
      )}
    </Layout>
  );
}
