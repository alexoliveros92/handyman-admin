// src/components/Layout.jsx
// Persistent sidebar + main content wrapper for all admin pages.
//
// The sidebar shows three navigation items (Pending / Approved / Rejected)
// and a logout button at the bottom. NavLink from React Router automatically
// adds an active style when the link's URL matches the current page.

import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  {
    status: 'pending',
    label: 'Pending',
    color: 'text-amber-600',
    activeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    status: 'approved',
    label: 'Approved',
    color: 'text-green-600',
    activeColor: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  {
    status: 'rejected',
    label: 'Rejected',
    color: 'text-red-600',
    activeColor: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
];

export default function Layout({ children }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">

        {/* Brand header */}
        <div className="h-16 flex items-center px-5 border-b border-gray-200">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center mr-2.5 flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">HandyMan</p>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Applications
          </p>
          {NAV_ITEMS.map(({ status, label, activeColor, dot }) => (
            <NavLink
              key={status}
              to={`/handymen/${status}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ` +
                (isActive
                  ? `${activeColor} border-opacity-100`
                  : 'text-gray-600 hover:bg-gray-50 border-transparent')
              }
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              {label}
            </NavLink>
          ))}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-5">
            Finance
          </p>
          <NavLink
            to="/payouts"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ` +
              (isActive
                ? 'bg-primary-50 text-primary-700 border-primary-200 border-opacity-100'
                : 'text-gray-600 hover:bg-gray-50 border-transparent')
            }
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-primary-500" />
            Payouts
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                       text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}