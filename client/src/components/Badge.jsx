import { priorityLabel, statusLabel } from '../utils/format.js';

export function PriorityBadge({ priority }) {
  const classes = {
    high: 'bg-red-500/15 text-red-400 border border-red-500/20',
    medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    low: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
  };
  return <span className={`badge ${classes[priority] || classes.medium}`}>{priorityLabel(priority)}</span>;
}

export function StatusBadge({ status }) {
  const classes = {
    todo: 'bg-zinc-700/50 text-zinc-300',
    in_progress: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    done: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    overdue: 'bg-red-500/15 text-red-400 border border-red-500/20'
  };
  return <span className={`badge ${classes[status] || classes.todo}`}>{statusLabel(status)}</span>;
}
