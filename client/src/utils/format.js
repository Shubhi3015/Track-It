export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

export function avatarGradient(name = '') {
  const palettes = [
    'from-indigo-500 to-cyan-400',
    'from-fuchsia-500 to-indigo-500',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-rose-500',
    'from-sky-500 to-violet-500',
    'from-lime-500 to-emerald-500'
  ];
  const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[sum % palettes.length];
}

export function formatDate(value, options = {}) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...options }).format(new Date(value));
}

export function fullDate(value) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(
    value ? new Date(value) : new Date()
  );
}

export function isOverdue(task) {
  if (!task?.dueDate || task.status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today || task.status === 'overdue';
}

export function statusLabel(status) {
  return {
    todo: 'Todo',
    in_progress: 'In Progress',
    done: 'Done',
    overdue: 'Overdue'
  }[status] || status;
}

export function priorityLabel(priority) {
  return priority ? priority[0].toUpperCase() + priority.slice(1) : '';
}
