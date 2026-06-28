// src/pages/LoginPage.jsx
// Accepts the admin secret and calls AuthContext.login() to store it.
// No server call happens here — invalid secrets fail on the first real
// data request (a clear 401 Unauthorized from the backend).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError('Please enter the admin secret.');
      return;
    }
    login(secret.trim());
    navigate('/handymen/pending', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HandyMan Admin</h1>
          <p className="text-sm text-gray-500 mt-1">HR & Applicant Review</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Admin secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => { setSecret(e.target.value); setError(''); }}
                placeholder="Enter your admin secret"
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700
                         text-white text-sm font-semibold rounded-lg
                         transition-colors duration-150 focus:outline-none
                         focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is an internal tool. Keep this URL confidential.
        </p>
      </div>
    </div>
  );
}