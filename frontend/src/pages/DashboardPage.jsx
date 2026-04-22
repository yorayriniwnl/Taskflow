import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi } from '../api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ code, value, label, tone = 'accent', note }) => (
  <div className="stat-card">
    <div className="stat-topline">
      <div className={`stat-icon stat-icon-${tone}`}>{code}</div>
      <div className="stat-note">{note}</div>
    </div>
    <div className="stat-value">{value ?? 0}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    Promise.all([
      tasksApi.getStats(),
      tasksApi.getAll({ limit: 5, sortBy: 'created_at', sortOrder: 'DESC' }),
    ])
      .then(([statsResponse, tasksResponse]) => {
        setStats(statsResponse.data.data.stats);
        setRecent(tasksResponse.data.data.tasks);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const total = stats?.total || 0;
  const done = stats?.done || 0;
  const active = (stats?.todo || 0) + (stats?.in_progress || 0);
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const visibleOwners = new Set(recent.map((task) => task.user_id)).size;

  const heroSignals = [
    { label: 'Completion', value: `${completionRate}%` },
    { label: 'Active flow', value: active },
    { label: isAdmin ? 'Visible owners' : 'High priority', value: isAdmin ? visibleOwners : stats?.high_priority_pending || 0 },
  ];

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="page-eyebrow">Command briefing</div>
          <h1 className="dashboard-hero-title">Welcome back, {firstName}</h1>
          <div className="dashboard-hero-subtitle">
            {isAdmin
              ? 'Track ownership, delivery pressure, and platform momentum from a workspace that feels engineered for high-stakes execution.'
              : 'Track priorities, delivery pressure, and daily momentum from a workspace that feels engineered for deliberate execution.'}
          </div>

          <div className="dashboard-hero-actions">
            <div className="header-stat">
              <span className="header-stat-label">Completion rate</span>
              <strong>{completionRate}%</strong>
            </div>
            <Link to="/tasks" className="btn btn-primary">Open task board</Link>
          </div>

          <div className="hero-signal-list">
            {heroSignals.map((signal) => (
              <div key={signal.label} className="hero-signal">
                <span className="hero-signal-label">{signal.label}</span>
                <strong className="hero-signal-value">{signal.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-hero-visual" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />

          <div className="hero-prism hero-prism-primary">
            <span className="hero-prism-label">Execution index</span>
            <strong className="hero-prism-value">{completionRate}%</strong>
            <span className="hero-prism-copy">delivery confidence</span>
          </div>

          <div className="hero-prism hero-prism-secondary">
            <span className="hero-prism-label">Open lanes</span>
            <strong className="hero-prism-value">{active}</strong>
            <span className="hero-prism-copy">tasks in motion</span>
          </div>

          <div className="hero-prism hero-prism-tertiary">
            <span className="hero-prism-label">{isAdmin ? 'Oversight' : 'Priority load'}</span>
            <strong className="hero-prism-value">{isAdmin ? visibleOwners : stats?.high_priority_pending || 0}</strong>
            <span className="hero-prism-copy">{isAdmin ? 'owners visible now' : 'urgent items open'}</span>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="stats-grid">
          <StatCard code="AL" value={total} label="All tasks" note="Current edition" />
          <StatCard code="TD" value={stats?.todo} label="Todo" note="Awaiting attention" />
          <StatCard code="IP" value={stats?.in_progress} label="In progress" tone="cool" note="Now moving" />
          <StatCard code="DN" value={done} label="Done" tone="success" note="Closed cleanly" />
          <StatCard code="HP" value={stats?.high_priority_pending} label="High priority" tone="danger" note="Needs focus" />
          <StatCard code="OD" value={stats?.overdue} label="Overdue" tone="warning" note="Immediate review" />
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent tasks</div>
                <div className="card-subtitle">The latest items added to your workspace.</div>
              </div>
              <Link to="/tasks" className="btn btn-ghost btn-sm">Open board</Link>
            </div>

            <div className="card-body card-body-tight">
              {recent.length === 0 ? (
                <div className="empty-state">
                  <h3>No tasks yet</h3>
                  <p>Your board is ready. Add the first task and shape the workflow from there.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Priority</th>
                        {isAdmin && <th>Owner</th>}
                        <th>Due date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((task) => {
                        const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

                        return (
                          <tr key={task.id}>
                            <td className="table-emphasis">{task.title}</td>
                            <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                            <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                            {isAdmin && <td className="table-owner">{task.user_name}</td>}
                            <td className={`due-date${overdue ? ' overdue' : ''}`}>
                              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card spotlight-card">
            <div className="card-header">
              <div>
                <div className="card-title">Execution pulse</div>
                <div className="card-subtitle">A quick signal on what is moving and what needs care.</div>
              </div>
            </div>

            <div className="card-body">
              <div className="spotlight-eyebrow">This week in motion</div>
              <div className="spotlight-value">{active}</div>
              <div className="spotlight-copy">tasks are currently in motion across your board.</div>

              <div className="insight-list">
                <div className="insight-row">
                  <span>High priority open</span>
                  <strong>{stats?.high_priority_pending || 0}</strong>
                </div>
                <div className="insight-row">
                  <span>Overdue risk</span>
                  <strong>{stats?.overdue || 0}</strong>
                </div>
                <div className="insight-row">
                  <span>Tasks completed</span>
                  <strong>{done}</strong>
                </div>
              </div>

              <Link to="/tasks" className="btn btn-ghost btn-full">Review task board</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
