import { Edit3, Plus, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import { PriorityBadge } from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import TaskModal from '../components/TaskModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';
import { formatDate, isOverdue, statusLabel } from '../utils/format.js';

const columns = [
  { key: 'todo', label: 'Todo', border: 'border-t-zinc-500' },
  { key: 'in_progress', label: 'In Progress', border: 'border-t-blue-500' },
  { key: 'done', label: 'Done', border: 'border-t-emerald-500' },
  { key: 'overdue', label: 'Overdue', border: 'border-t-red-500' }
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ status: '', assignee: '', priority: '' });
  const [modal, setModal] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (isAdmin) api('/api/users').then((data) => setUsers(data.users)).catch(() => {});
  }, [isAdmin]);

  async function load() {
    try {
      const data = await api(`/api/projects/${id}`);
      setProject(data.project);
      setTasks(data.tasks);
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const effectiveStatus = isOverdue(task) ? 'overdue' : task.status;
        return (
          (!filters.status || effectiveStatus === filters.status) &&
          (!filters.assignee || task.assignedTo === filters.assignee) &&
          (!filters.priority || task.priority === filters.priority)
        );
      }),
    [filters, tasks]
  );

  async function createTask(form) {
    try {
      const { task } = await api('/api/tasks', { method: 'POST', body: JSON.stringify(form) });
      setTasks((items) => [task, ...items]);
      setModal(null);
      notify('Task created');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function updateProject(form) {
    try {
      const { project: updated } = await api(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(form) });
      setProject(updated);
      setModal(null);
      notify('Project updated');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function addMember(userId) {
    try {
      const { project: updated } = await api(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify({ userId }) });
      setProject(updated);
      setModal(null);
      notify('Member added');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  if (!project) return <div className="text-zinc-400">Loading project...</div>;

  return (
    <div>
      <header className="mb-6 rounded-2xl border border-[#2E2E2E] bg-[#1A1A1A] p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="mt-2 max-w-3xl text-zinc-400">{project.description}</p>
            <div className="mt-5 flex items-center">
              {project.members.map((member, index) => (
                <Avatar key={member.id} name={member.name} className={index ? '-ml-2' : ''} />
              ))}
              <span className="ml-3 text-sm text-zinc-400">{project.memberCount} members</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={() => setModal('member')}>
                <UserPlus className="h-4 w-4" />
                Add Member
              </button>
              <button className="btn-secondary" onClick={() => setModal('edit')}>
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mb-5 grid gap-3 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] p-4 md:grid-cols-3">
        <select className="field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          {columns.map((column) => (
            <option key={column.key} value={column.key}>
              {column.label}
            </option>
          ))}
        </select>
        <select className="field" value={filters.assignee} onChange={(event) => setFilters({ ...filters, assignee: event.target.value })}>
          <option value="">All assignees</option>
          {project.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
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

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = visibleTasks.filter((task) => (isOverdue(task) ? 'overdue' : task.status) === column.key);
          return (
            <section key={column.key} className={`min-h-[420px] rounded-xl border border-[#2E2E2E] border-t-2 ${column.border} bg-[#161616] p-4`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">{column.label}</h2>
                <span className="badge bg-[#242424] text-zinc-300">{columnTasks.length}</span>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <article key={task.id} className="card card-hover p-4">
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{task.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={task.assigneeName || 'Unassigned'} />
                        <span className="truncate text-sm text-zinc-300">{task.assigneeName || 'Unassigned'}</span>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <span className="badge mt-3 bg-[#242424] text-zinc-300">{formatDate(task.dueDate)}</span>
                  </article>
                ))}
              </div>
              {isAdmin && column.key === 'todo' && (
                <button className="btn-secondary mt-4 w-full" onClick={() => setModal('task')}>
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              )}
            </section>
          );
        })}
      </div>

      {modal === 'task' && (
        <TaskModal
          projects={[project]}
          users={project.members}
          initial={{ projectId: project.id }}
          onClose={() => setModal(null)}
          onSubmit={createTask}
        />
      )}
      {modal === 'edit' && <ProjectEditModal project={project} onClose={() => setModal(null)} onSubmit={updateProject} />}
      {modal === 'member' && (
        <AddMemberModal
          users={users.filter((user) => !project.members.some((member) => member.id === user.id))}
          onClose={() => setModal(null)}
          onSubmit={addMember}
        />
      )}
    </div>
  );
}

function ProjectEditModal({ project, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: project.name, description: project.description });
  return (
    <Modal title="Edit Project" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <label className="block">
          <span className="label">Name</span>
          <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea className="field min-h-28 resize-none" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberModal({ users, onClose, onSubmit }) {
  const [userId, setUserId] = useState(users[0]?.id || '');
  return (
    <Modal title="Add Member" onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(userId);
        }}
      >
        <label className="block">
          <span className="label">User</span>
          <select className="field" value={userId} onChange={(event) => setUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        </label>
        {!users.length && <p className="text-sm text-zinc-400">Every user is already a member of this project.</p>}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!userId}>
            Add Member
          </button>
        </div>
      </form>
    </Modal>
  );
}
