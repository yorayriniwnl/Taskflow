import { useCallback, useEffect, useState } from 'react';
import { adminApi, tasksApi } from '../api';

const ADMIN_STATS = [
  { code: 'AL', label: 'All tasks', key: 'total' },
  { code: 'TD', label: 'Todo', key: 'todo' },
  { code: 'IP', label: 'In progress', key: 'in_progress', tone: 'cool' },
  { code: 'DN', label: 'Done', key: 'done', tone: 'success' },
  { code: 'HP', label: 'High priority', key: 'high_priority_pending', tone: 'danger' },
  { code: 'OD', label: 'Overdue', key: 'overdue', tone: 'warning' },
];

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [allStats, setAllStats] = useState(null);

  const flash = (text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const params = { ...filters };
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);

      const response = await adminApi.getUsers(params);
      setUsers(response.data.data.users);
      setMeta({
        page: response.data.data.page,
        totalPages: response.data.data.totalPages,
        total: response.data.data.total,
      });
    } catch {
      flash('Failed to load users.', true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    tasksApi.getStats().then((response) => setAllStats(response.data.data.stats)).catch(() => {});
  }, []);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;

    try {
      await adminApi.deactivateUser(id);
      flash(`${name} has been deactivated.`);
      fetchUsers();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to deactivate user.', true);
    }
  };

  const setFilter = (key) => (event) => setFilters((current) => ({
    ...current,
    [key]: event.target.value,
    page: 1,
  }));

  const setPage = (page) => setFilters((current) => ({ ...current, page }));
  const clearFilters = () => setFilters({ search: '', role: '', page: 1 });

  return (
    <>
      <div className="page-header">
        <div className="page-header-copy">
          <div className="page-eyebrow">Admin control</div>
          <div className="page-title">Workspace oversight</div>
          <div className="page-subtitle">
            Manage users, filter the directory, and keep a high-level view of platform activity.
          </div>
        </div>

        <div className="page-actions">
          <div className="header-stat">
            <span className="header-stat-label">Users</span>
            <strong>{meta.total}</strong>
          </div>
        </div>
      </div>

      <div className="page-content">
        {msg && <div className={`alert alert-${msg.error ? 'error' : 'success'}`}>{msg.text}</div>}

        {allStats && (
          <div className="stats-grid">
            {ADMIN_STATS.map((item) => (
              <div key={item.key} className="stat-card">
                <div className={`stat-icon stat-icon-${item.tone || 'accent'}`}>{item.code}</div>
                <div className="stat-value">{allStats[item.key] ?? 0}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">User directory</div>
              <div className="card-subtitle">Filter the list by name or role, then act when needed.</div>
            </div>

            {(filters.search || filters.role) && (
              <button className="btn btn-ghost btn-sm" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="card-body">
            <div className="filters admin-filters">
              <input
                className="form-input"
                placeholder="Search users"
                value={filters.search}
                onChange={setFilter('search')}
              />

              <select className="form-select" value={filters.role} onChange={setFilter('role')}>
                <option value="">All roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner" /> Loading users...</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last login</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="table-emphasis">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-high' : 'badge-todo'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? 'badge-done' : 'badge-high'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'No activity'}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {user.is_active && user.role !== 'admin' && (
                          <button
                            className="btn btn-danger btn-sm"
                            type="button"
                            onClick={() => handleDeactivate(user.id, user.name)}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="pagination pagination-padded">
              <button
                className="page-btn"
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage(meta.page - 1)}
              >
                Prev
              </button>

              {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn${page === meta.page ? ' active' : ''}`}
                  type="button"
                  onClick={() => setPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn"
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(meta.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
