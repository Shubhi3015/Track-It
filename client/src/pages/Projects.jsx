import { ArrowRight, FolderPlus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';

export default function Projects() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api('/api/projects')
      .then((data) => setProjects(data.projects))
      .catch((error) => notify(error.message, 'error'));
  }, [notify]);

  async function createProject(form) {
    const { project } = await api('/api/projects', { method: 'POST', body: JSON.stringify(form) });
    setProjects((items) => [project, ...items]);
    setShowModal(false);
    notify('Project created');
  }

  return (
    <div>
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-zinc-400">Track team workspaces and active initiatives.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </header>

      {projects.length === 0 ? (
        <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-[#2E2E2E]">
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <FolderPlus className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">No projects yet.</h2>
            <p className="mt-2 text-zinc-400">Create your first one.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link className="card card-hover block" to={`/projects/${project.id}`} key={project.id}>
              <div className="mb-5">
                <h2 className="text-xl font-bold">{project.name}</h2>
                <p className="line-clamp-2 mt-2 min-h-10 text-sm leading-5 text-zinc-400">{project.description || 'No description provided.'}</p>
              </div>
              <div className="mb-5 flex items-center justify-between text-sm text-zinc-400">
                <div className="flex items-center">
                  {project.members.slice(0, 4).map((member, index) => (
                    <Avatar key={member.id} name={member.name} className={index ? '-ml-2' : ''} />
                  ))}
                  <span className="ml-3">{project.memberCount} members</span>
                </div>
                <span>{project.taskCount} tasks</span>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300">
                View Project <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSubmit={createProject} />}
    </div>
  );
}

function ProjectModal({ onClose, onSubmit }) {
  const { notify } = useToast();
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Name</span>
          <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea
            className="field min-h-28 resize-none"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
}
