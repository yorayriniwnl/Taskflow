import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../utils/apiError';

export default function TaskModal({ task, onSave, onClose, isAdmin = false, assignees = [], currentUserId }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    tags: '',
    user_id: currentUserId || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) {
      setForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        tags: '',
        user_id: currentUserId || '',
      });
      return;
    }

    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      tags: (task.tags || []).join(', '),
      user_id: task.user_id || currentUserId || '',
    });
  }, [currentUserId, task]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    if (isAdmin && !form.user_id) {
      setError('Assignee is required for admin-created tasks.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        tags: form.tags
          ? Array.from(new Set(form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)))
          : [],
        due_date: form.due_date || null,
        user_id: isAdmin ? form.user_id : undefined,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save task.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">{task ? 'Edit task' : 'Create task'}</div>
            <div className="modal-title" id="task-modal-title">
              {task ? 'Refine the details and keep the board sharp.' : 'Add a new task with clarity from the start.'}
            </div>
          </div>

          <button className="btn btn-ghost btn-sm btn-icon" type="button" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={set('title')}
                placeholder="What needs to happen next?"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={set('description')}
                placeholder="Context, expectations, and any notes worth keeping close."
              />
            </div>

            <div className="form-row">
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-select" value={form.user_id} onChange={set('user_id')}>
                    <option value="">Select assignee</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} ({assignee.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={set('priority')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Due date</label>
                <input className="form-input" type="date" value={form.due_date} onChange={set('due_date')} />
              </div>

              <div className="form-group">
                <label className="form-label">Tags</label>
                <input
                  className="form-input"
                  value={form.tags}
                  onChange={set('tags')}
                  placeholder="design, launch, urgent"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
