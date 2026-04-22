import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Overview', code: 'OV' },
  { to: '/tasks', label: 'Tasks', code: 'TK' },
  { to: '/profile', label: 'Profile', code: 'PF' },
];

const PAGE_LABELS = {
  '/dashboard': 'Overview',
  '/tasks': 'Task Board',
  '/profile': 'Profile',
  '/admin': 'Admin',
};

const SIDEBAR_TILES = [
  { label: 'Sync', value: 'Realtime' },
  { label: 'Guard', value: 'JWT + RBAC' },
  { label: 'Scale', value: 'API v1' },
];

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TF';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = getInitials(user?.name);
  const currentPage = PAGE_LABELS[location.pathname] || 'Workspace';

  return (
    <div className={`app-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <div className="app-ambience app-ambience-one" aria-hidden="true" />
      <div className="app-ambience app-ambience-two" aria-hidden="true" />
      <div className="app-ambience app-ambience-three" aria-hidden="true" />

      <button
        className="app-backdrop"
        type="button"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="sidebar">
        <div className="sidebar-ledger">
          <span>Volume 01</span>
          <span>Private Edition</span>
        </div>

        <div className="sidebar-top">
          <div className="brand-stack">
            <div className="brand-mark">TF</div>
            <div className="sidebar-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div>
            <div className="brand-kicker">Private command layer</div>
            <div className="brand-name">TaskFlow</div>
          </div>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-card-label">Capital-grade focus</div>
          <h2>Make every workflow feel like a premium control surface.</h2>
          <p>Ownership, urgency, and execution arranged with depth, clarity, and a sharper operational signal.</p>

          <div className="sidebar-data-grid">
            {SIDEBAR_TILES.map((tile) => (
              <div key={tile.label} className="sidebar-data-tile">
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-signature">
          Designed for teams who want the interface to feel as decisive as the work itself.
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.code}</span>
              <span className="nav-copy">
                <span className="nav-label">{item.label}</span>
                <span className="nav-caption">
                  {item.to === '/dashboard'
                    ? 'Momentum and signals'
                    : item.to === '/tasks'
                      ? 'Priorities and execution'
                      : 'Identity and security'}
                </span>
              </span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">AD</span>
              <span className="nav-copy">
                <span className="nav-label">Admin</span>
                <span className="nav-caption">Users and oversight</span>
              </span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-panel">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-copy">
              <div className="user-name">{user?.name}</div>
              <div className="user-meta">{user?.email}</div>
            </div>
          </div>

          <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Workspace member'}</div>

          <button className="btn btn-ghost btn-full sidebar-logout" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="shell-topbar">
          <div className="shell-topbar-left">
            <button
              className="mobile-nav-toggle"
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <span />
              <span />
            </button>

            <div>
              <div className="shell-label">TaskFlow command deck</div>
              <div className="shell-page-label">{currentPage}</div>
            </div>
          </div>

          <div className="shell-meta">
            <div className="shell-badge">Live workspace</div>
            <div className="shell-badge shell-badge-accent">
              {user?.role === 'admin' ? 'Admin command' : 'Private board'}
            </div>
            <div className="shell-orbit-marker" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="content-shell">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
