import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';

export default function TaskModal({ title = 'New Task', projects = [], users = [], initial = {}, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: projects[0]?.id || '',
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    ...initial
  });
  const [busy, setBusy] = useState(false);
  const assigneeOptions = projects.find((project) => project.id === form.projectId)?.members || users;

  useEffect(() => {
    if (!form.projectId && projects[0]?.id) setForm((value) => ({ ...value, projectId: projects[0].id }));
  }, [form.projectId, projects]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    await onSubmit({ ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null });
    setBusy(false);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="block">
          <span className="label">Title</span>
          <input className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea
            className="field min-h-24 resize-none"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="label">Project</span>
            <select className="field" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} required>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Assignee</span>
            <select className="field" value={form.assignedTo || ''} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}>
              <option value="">Unassigned</option>
              {assigneeOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="label">Status</span>
            <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Priority</span>
            <select className="field" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Due Date</span>
            <input className="field" type="date" value={form.dueDate || ''} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !projects.length}>
            Save Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
