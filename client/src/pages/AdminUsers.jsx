import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';
import { formatDate } from '../utils/format.js';

export default function AdminUsers() {
  const { notify } = useToast();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api('/api/users')
      .then((data) => setUsers(data.users))
      .catch((error) => notify(error.message, 'error'));
  }, [notify]);

  async function changeRole(user, role) {
    try {
      const { user: updated } = await api(`/api/users/${user.id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
      setUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      notify('Role updated');
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="mt-2 text-zinc-400">Manage workspace access and roles.</p>
      </header>
      <div className="overflow-hidden rounded-xl border border-[#2E2E2E] bg-[#1A1A1A]">
        <div className="hidden grid-cols-[1.2fr_1.4fr_160px_160px] border-b border-[#2E2E2E] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid">
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Joined</span>
        </div>
        <div className="divide-y divide-[#2E2E2E]">
          {users.map((user) => (
            <div key={user.id} className="table-row-hover grid gap-4 px-5 py-4 md:grid-cols-[1.2fr_1.4fr_160px_160px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user.name} />
                <span className="truncate font-medium">{user.name}</span>
              </div>
              <span className="truncate text-sm text-zinc-400">{user.email}</span>
              <select
                className={`field max-w-36 ${
                  user.role === 'admin' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200' : 'border-zinc-700 bg-zinc-800/60 text-zinc-300'
                }`}
                value={user.role}
                onChange={(event) => changeRole(user, event.target.value)}
              >
                <option value="admin">admin</option>
                <option value="member">member</option>
              </select>
              <span className="text-sm text-zinc-400">{formatDate(user.createdAt, { year: 'numeric' })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
