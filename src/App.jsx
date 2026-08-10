// src/App.jsx
// Root of the React application.
// Declares the route map and enforces authentication — unauthenticated
// visitors are redirected to /login before any admin route renders.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HandymanListPage from './pages/HandymanListPage.jsx';
import HandymanDetailPage from './pages/HandymanDetailPage.jsx';
import PayoutsPage from './pages/PayoutsPage.jsx';

// Wraps any route that requires an admin secret.
// If no secret is stored, redirect to /login — preserving the intended
// destination in `state` so login can redirect back afterward.
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAdminAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — all admin routes */}
      <Route
        path="/handymen/:status"
        element={
          <ProtectedRoute>
            <HandymanListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/handymen/detail/:id"
        element={
          <ProtectedRoute>
            <HandymanDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payouts"
        element={
          <ProtectedRoute>
            <PayoutsPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/handymen/pending" replace />} />
      <Route path="*" element={<Navigate to="/handymen/pending" replace />} />
    </Routes>
  );
}