const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatStatusLabel = (status = '') => status.replaceAll('_', ' ');

export const isTaskOverdue = (task) => {
  if (!task?.due_date || task.status === 'done') {
    return false;
  }

  const dueDate = normalizeDate(task.due_date);
  return dueDate ? dueDate < new Date() : false;
};

export const formatTaskDate = (value, fallback = 'No date') => {
  const date = normalizeDate(value);
  return date ? dateFormatter.format(date) : fallback;
};
