import { useCallback, useEffect, useState } from 'react';
import { adminApi, tasksApi } from '../api';
import StatCard from '../components/StatCard';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useTimedMessage from '../hooks/useTimedMessage';
import { getApiErrorMessage } from '../utils/apiError';
import { compactParams } from '../utils/params';

const ADMIN_STATS = [
  { code: 'AL', label: 'All tasks', key: 'total' },
  { code: 'TD', label: 'Todo', key: 'todo' },
  { code: 'IP', label: 'In progress', key: 'in_progress', tone: 'cool' },
  { code: 'DN', label: 'Done', key: 'done', tone: 'success' },
  { code: 'HP', label: 'High priority', key: 'high_priority_pending', tone: 'danger' },
  { code: 'OD', label: 'Overdue', key: 'overdue', tone: 'warning' },
];

const DEFAULT_FILTERS = { search: '', role: '', page: 1 };

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allStats, setAllStats] = useState(null);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const { message: notice, show: showNotice } = useTimedMessage();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminApi.getUsers(compactParams({ ...filters, search: debouncedSearch }));
      setUsers(response.data.data.users);
      setMeta({
        page: response.data.data.page,
        totalPages: response.data.data.totalPages,
        total: response.data.data.total,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.page, filters.role]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let active = true;

    tasksApi.getStats()
      .then((response) => {
        if (active) {
          setAllStats(response.data.data.stats);
        }
      })
      .catch((err) => {
        if (active) {
          showNotice(getApiErrorMessage(err, 'Failed to load admin stats.'), { error: true });
        }
      });

    return () => {
      active = false;
    };
  }, [showNotice]);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;

    try {
      await adminApi.deactivateUser(id);
      await fetchUsers();
      showNotice(`${name} has been deactivated.`);
    } catch (err) {
      showNotice(getApiErrorMessage(err, 'Failed to deactivate user.'), { error: true });
    }
  };

  const setFilter = (key) => (event) => setFilters((current) => ({
    ...current,
    [key]: event.target.value,
    page: 1,
  }));

  const setPage = (page) => setFilters((current) => ({ ...current, page }));
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

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
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className={`alert alert-${notice.error ? 'error' : 'success'}`}>{notice.text}</div>}

        {allStats && (
          <div className="stats-grid">
            {ADMIN_STATS.map((item) => (
              <StatCard
                key={item.key}
                code={item.code}
                label={item.label}
                tone={item.tone}
                value={allStats[item.key]}
              />
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
          ) : users.length === 0 ? (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>Adjust the filters to bring matching accounts back into view.</p>
            </div>
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
