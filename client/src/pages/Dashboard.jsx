import { CalendarClock, CheckCircle2, FolderKanban, Hourglass, Plus, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api.js';
import { formatDate, fullDate, isOverdue } from '../utils/format.js';
import { PriorityBadge } from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { notify } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api('/api/tasks/my-tasks'), api('/api/projects')])
      .then(([taskData, projectData]) => {
        setTasks(taskData.tasks);
        setProjects(projectData.projects);
      })
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return [
      { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-indigo-300 bg-indigo-500/10' },
      { label: 'Pending Tasks', value: tasks.filter((task) => task.status !== 'done').length, icon: Hourglass, color: 'text-amber-300 bg-amber-500/10' },
      { label: 'Overdue Tasks', value: tasks.filter(isOverdue).length, icon: TriangleAlert, color: 'text-red-300 bg-red-500/10' },
      {
        label: 'Completed This Week',
        value: tasks.filter((task) => task.status === 'done' && new Date(task.updatedAt) >= weekAgo).length,
        icon: CheckCircle2,
        color: 'text-emerald-300 bg-emerald-500/10'
      }
    ];
  }, [projects.length, tasks]);

  async function markDone(task) {
    try {
      const { task: updated } = await api(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: task.status === 'done' ? 'todo' : 'done' })
      });
      setTasks((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <div>
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Good morning, {user?.name}</h1>
          <p className="mt-2 text-zinc-400">{fullDate()}</p>
        </div>
        {isAdmin && (
          <Link className="btn-primary" to="/projects">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="card card-hover" key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-3 text-3xl font-bold">{loading ? '-' : value}</p>
              </div>
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold">My Recent Tasks</h2>
          <TaskPreviewList tasks={tasks.slice(0, 6)} onToggle={markDone} />
        </section>
        <section className="card">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-300" />
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
          </div>
          <TaskPreviewList tasks={tasks.filter((task) => task.dueDate).slice(0, 6)} onToggle={markDone} compact />
        </section>
      </div>
    </div>
  );
}

function TaskPreviewList({ tasks, onToggle, compact = false }) {
  if (!tasks.length) return <div className="rounded-xl border border-dashed border-[#2E2E2E] p-8 text-center text-zinc-400">You're all caught up.</div>;
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 rounded-xl border border-[#2E2E2E] bg-[#171717] p-3">
          <button
            className={`h-5 w-5 rounded-full border transition-all duration-200 ${
              task.status === 'done' ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-600 hover:border-indigo-400'
            }`}
            onClick={() => onToggle(task)}
            aria-label="Toggle task done"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{task.title}</p>
            {!compact && <p className="mt-1 text-xs text-zinc-500">{task.projectName}</p>}
          </div>
          <span className="badge bg-indigo-500/10 text-indigo-300">{task.projectName}</span>
          <span className="hidden text-xs text-zinc-400 sm:inline">{formatDate(task.dueDate)}</span>
          <PriorityBadge priority={task.priority} />
        </div>
      ))}
    </div>
  );
}
