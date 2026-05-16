import { Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badge.jsx';
import TaskModal from '../components/TaskModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';
import { formatDate, isOverdue, statusLabel } from '../utils/format.js';

export default function AllTasks() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ project: '', status: '', assignee: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [taskData, projectData] = await Promise.all([api('/api/tasks'), api('/api/projects')]);
      setTasks(taskData.tasks);
      setProjects(projectData.projects);
      if (isAdmin) {
        const userData = await api('/api/users');
        setUsers(userData.users);
      }
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const effectiveStatus = isOverdue(task) ? 'overdue' : task.status;
        const haystack = `${task.title} ${task.projectName} ${task.assigneeName || ''}`.toLowerCase();
        return (
          (!filters.project || task.projectId === filters.project) &&
          (!filters.status || effectiveStatus === filters.status) &&
          (!filters.assignee || task.assignedTo === filters.assignee) &&
          (!filters.priority || task.priority === filters.priority) &&
          (!filters.search || haystack.includes(filters.search.toLowerCase()))
        );
      }),
    [filters, tasks]
  );

  async function createTask(form) {
    try {
      const { task } = await api('/api/tasks', { method: 'POST', body: JSON.stringify(form) });
      setTasks((items) => [task, ...items]);
      setShowModal(false);
      notify('Task created');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function updateStatus(task, status) {
    try {
      const { task: updated } = await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setTasks((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function deleteTask(task) {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
      setTasks((items) => items.filter((item) => item.id !== task.id));
      notify('Task deleted');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <div>
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">All Tasks</h1>
          <p className="mt-2 text-zinc-400">Filter, scan, and keep team execution moving.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </button>
        )}
      </header>

      <div className="mb-5 grid gap-3 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] p-4 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="field pl-9"
            placeholder="Search tasks"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
        </label>
        <select className="field" value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })}>
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select className="field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="field" value={filters.assignee} onChange={(event) => setFilters({ ...filters, assignee: event.target.value })}>
          <option value="">All assignees</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select className="field" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2E2E2E] bg-[#1A1A1A]">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">No tasks match the current filters.</div>
        ) : (
          <div className="divide-y divide-[#2E2E2E]">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`table-row-hover grid gap-4 p-4 lg:grid-cols-[1.4fr_160px_130px_150px_140px_auto] lg:items-center ${isOverdue(task) ? 'border-l-2 border-l-red-500' : ''}`}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{task.title}</p>
                  <p className="mt-1 truncate text-sm text-zinc-500">{task.description || task.projectName}</p>
                </div>
                <span className="badge w-fit bg-indigo-500/10 text-indigo-300">{task.projectName}</span>
                <PriorityBadge priority={task.priority} />
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Avatar name={task.assigneeName || 'Unassigned'} />
                  <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
                </div>
                <span className="text-sm text-zinc-400">{formatDate(task.dueDate)}</span>
                <div className="flex items-center gap-2">
                  <select className="field min-w-36" value={task.status} onChange={(event) => updateStatus(task, event.target.value)}>
                    {['todo', 'in_progress', 'done', 'overdue'].map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                  {isAdmin && (
                    <button className="btn-danger !p-2" onClick={() => deleteTask(task)} aria-label="Delete task">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <TaskModal projects={projects} users={users} onClose={() => setShowModal(false)} onSubmit={createTask} />}
    </div>
  );
}
