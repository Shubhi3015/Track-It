import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';
import { formatDate, isOverdue, statusLabel } from '../utils/format.js';

export default function MyTasks() {
  const { notify } = useToast();
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState({ Today: true, 'This Week': true, Later: true });

  useEffect(() => {
    api('/api/tasks/my-tasks')
      .then((data) => setTasks(data.tasks))
      .catch((error) => notify(error.message, 'error'));
  }, [notify]);

  const groups = useMemo(() => groupTasks(tasks), [tasks]);

  async function changeStatus(task, status) {
    try {
      const { task: updated } = await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setTasks((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  if (!tasks.length) return <div className="grid min-h-[520px] place-items-center rounded-2xl border border-dashed border-[#2E2E2E] text-zinc-300">You're all caught up.</div>;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="mt-2 text-zinc-400">Your assigned work, grouped by timing.</p>
      </header>
      <div className="space-y-5">
        {Object.entries(groups).map(([label, items]) => (
          <section key={label} className="rounded-xl border border-[#2E2E2E] bg-[#1A1A1A]">
            <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen({ ...open, [label]: !open[label] })}>
              <span className="font-semibold">{label}</span>
              <span className="flex items-center gap-2 text-sm text-zinc-400">
                {items.length}
                {open[label] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            </button>
            {open[label] && (
              <div className="divide-y divide-[#2E2E2E]">
                {items.map((task) => (
                  <TaskLine key={task.id} task={task} onStatusChange={changeStatus} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function TaskLine({ task, onStatusChange }) {
  const dot = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-emerald-400' }[task.priority];
  return (
    <div className={`grid gap-4 p-4 md:grid-cols-[1fr_150px_140px_150px] md:items-center ${isOverdue(task) ? 'border-l-2 border-l-red-500' : ''}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="min-w-0">
          <p className="truncate font-medium">{task.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="badge bg-indigo-500/10 text-indigo-300">{task.projectName}</span>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={isOverdue(task) ? 'overdue' : task.status} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Avatar name={task.assigneeName || 'Unassigned'} />
        {task.assigneeName || 'Unassigned'}
      </div>
      <span className="text-sm text-zinc-400">{formatDate(task.dueDate)}</span>
      <select className="field" value={task.status} onChange={(event) => onStatusChange(task, event.target.value)}>
        {['todo', 'in_progress', 'done', 'overdue'].map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
    </div>
  );
}

function groupTasks(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  return tasks.reduce(
    (acc, task) => {
      const due = task.dueDate ? new Date(task.dueDate) : null;
      if (due && due.toDateString() === today.toDateString()) acc.Today.push(task);
      else if (due && due <= weekEnd) acc['This Week'].push(task);
      else acc.Later.push(task);
      return acc;
    },
    { Today: [], 'This Week': [], Later: [] }
  );
}
