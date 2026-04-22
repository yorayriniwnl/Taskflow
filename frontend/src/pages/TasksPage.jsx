import { useCallback, useEffect, useState } from 'react';
import { adminApi, tasksApi } from '../api';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useTimedMessage from '../hooks/useTimedMessage';
import { getApiErrorMessage } from '../utils/apiError';
import { compactParams } from '../utils/params';
import { formatStatusLabel, formatTaskDate, isTaskOverdue } from '../utils/tasks';
const DEFAULT_FILTERS = { search: '', status: '', priority: '', user_id: '', page: 1 };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const { message: notice, show: showNotice } = useTimedMessage();
  const isAdmin = user?.role === 'admin';
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const visibleDone = tasks.filter((task) => task.status === 'done').length;
  const visibleHighPriority = tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length;
  const visibleOverdue = tasks.filter(isTaskOverdue).length;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await tasksApi.getAll(compactParams({
        ...filters,
        search: debouncedSearch,
      }));

      setTasks(response.data.data.tasks);
      setMeta({
        page: response.data.data.page,
        totalPages: response.data.data.totalPages,
        total: response.data.data.total,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tasks.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.page, filters.priority, filters.status, filters.user_id]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!isAdmin) {
      setAssignees([]);
      return;
    }

    adminApi.getUsers({ limit: 100 })
      .then((response) => {
        setAssignees(response.data.data.users.filter((candidate) => candidate.is_active));
      })
      .catch((err) => {
        showNotice(getApiErrorMessage(err, 'Failed to load assignees.'), { error: true });
      });
  }, [isAdmin, showNotice]);

  const handleCreate = async (data) => {
    await tasksApi.create(data);
    await fetchTasks();
    showNotice('Task created.');
  };

  const handleUpdate = async (data) => {
    await tasksApi.update(modal.id, data);
    await fetchTasks();
    showNotice('Task updated.');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await tasksApi.delete(id);
      await fetchTasks();
      showNotice('Task deleted.');
    } catch (err) {
      showNotice(getApiErrorMessage(err, 'Failed to delete task.'), { error: true });
    }
  };

  const handleStatusToggle = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';

    try {
      await tasksApi.update(task.id, { status: nextStatus });
      await fetchTasks();
    } catch (err) {
      showNotice(getApiErrorMessage(err, 'Failed to update status.'), { error: true });
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
          <div className="page-eyebrow">Task board</div>
          <div className="page-title">Your curated task flow</div>
          <div className="page-subtitle">
            {isAdmin
              ? 'Filter the full workspace, assign clear ownership, and keep execution obvious at a glance.'
              : 'Search fast, filter cleanly, and keep execution obvious at a glance.'}
          </div>
        </div>

        <div className="page-actions">
          <div className="header-stat">
            <span className="header-stat-label">Filtered results</span>
            <strong>{meta.total}</strong>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => setModal('create')}>
            Create task
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className={`alert alert-${notice.error ? 'error' : 'success'}`}>{notice.text}</div>}

        <div className="card toolbar-card">
          <div className="card-header">
            <div>
              <div className="card-title">Refine the board</div>
              <div className="card-subtitle">
                Cut noise by title, then narrow the list by status and priority.
              </div>
            </div>

            {(filters.search || filters.status || filters.priority || filters.user_id) && (
              <button className="btn btn-ghost btn-sm" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="card-body">
            <div className={`filters${isAdmin ? ' filters-admin' : ''}`}>
              <input
                className="form-input search-input"
                placeholder={isAdmin ? 'Search tasks, owners, or emails' : 'Search tasks'}
                value={filters.search}
                onChange={setFilter('search')}
              />

              <select className="form-select" value={filters.status} onChange={setFilter('status')}>
                <option value="">All status</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>

              <select className="form-select" value={filters.priority} onChange={setFilter('priority')}>
                <option value="">All priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {isAdmin && (
                <select className="form-select" value={filters.user_id} onChange={setFilter('user_id')}>
                  <option value="">All assignees</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} ({assignee.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="board-summary-grid">
          <div className="board-summary-card">
            <span className="board-summary-label">Visible tasks</span>
            <strong className="board-summary-value">{meta.total}</strong>
          </div>
          <div className="board-summary-card">
            <span className="board-summary-label">Completed in view</span>
            <strong className="board-summary-value">{visibleDone}</strong>
          </div>
          <div className="board-summary-card">
            <span className="board-summary-label">High priority</span>
            <strong className="board-summary-value">{visibleHighPriority}</strong>
          </div>
          <div className="board-summary-card">
            <span className="board-summary-label">Overdue risk</span>
            <strong className="board-summary-value">{visibleOverdue}</strong>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>Create the first task or loosen the filters to bring results back into view.</p>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setModal('create')}>
              Create task
            </button>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task);

              return (
                <div key={task.id} className={`task-item${task.status === 'done' ? ' done' : ''}`}>
                  <button
                    className={`task-checkbox${task.status === 'done' ? ' checked' : ''}`}
                    type="button"
                    title="Toggle complete"
                    onClick={() => handleStatusToggle(task)}
                  >
                    {task.status === 'done' ? 'OK' : ''}
                  </button>

                  <div className="task-body">
                    <div className="task-heading">
                      <div>
                        <div className={`task-title${task.status === 'done' ? ' done' : ''}`}>{task.title}</div>
                        {task.description && <div className="task-desc">{task.description}</div>}
                      </div>

                      <div className="task-actions">
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setModal(task)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm danger-text"
                          type="button"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="task-meta">
                      <span className={`badge badge-${task.status}`}>{formatStatusLabel(task.status)}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>

                      {isAdmin && <span className="owner-badge">{task.user_name}</span>}

                      {task.due_date && (
                        <span className={`due-date${overdue ? ' overdue' : ''}`}>
                          {formatTaskDate(task.due_date)}
                        </span>
                      )}

                      {(task.tags || []).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="pagination">
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

      {modal === 'create' && (
        <TaskModal
          assignees={assignees}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== 'create' && (
        <TaskModal
          assignees={assignees}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          task={modal}
          onSave={handleUpdate}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
