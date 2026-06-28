// src/context/AuthContext.jsx
// Manages the admin session — just a stored admin secret.
//
// This is intentionally simpler than the mobile app's AuthContext
// (which deals with Supabase JWTs, user profiles, and role detection).
// The admin dashboard only needs one thing: is a valid admin secret stored?
//
// Security model: the admin secret is validated lazily — the first API
// call that fails with 401 tells you the stored secret is wrong. This is
// acceptable for an internal tool used by a small trusted team.

import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'handyman_admin_secret';

export const AuthProvider = ({ children }) => {
  // Initialise from localStorage so refreshes don't log the admin out
  const [adminSecret, setAdminSecret] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );

  const login = useCallback((secret) => {
    localStorage.setItem(STORAGE_KEY, secret);
    setAdminSecret(secret);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAdminSecret('');
  }, []);

  return (
    <AuthContext.Provider value={{ adminSecret, isLoggedIn: !!adminSecret, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AuthProvider');
  return ctx;
};