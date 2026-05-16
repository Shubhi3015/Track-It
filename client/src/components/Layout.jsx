import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, FolderKanban, ListChecks, LogOut, Menu, Moon, Shield, Sparkles, Sun, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Avatar from './Avatar.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/my-tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/tasks', label: 'All Tasks', icon: Sparkles },
  { to: '/admin/users', label: 'Admin', icon: Shield, admin: true }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 768px)').matches);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-zinc-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#2E2E2E] bg-[#111111] transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div className="flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-white">
              <Zap className="h-5 w-5" />
            </div>
            {!collapsed && <span className="text-lg font-bold">Track It</span>}
          </div>
          <button className="btn-secondary !p-2 lg:hidden" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {links
            .filter((link) => !link.admin || user?.role === 'admin')
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-transparent text-zinc-400 hover:bg-[#242424] hover:text-zinc-100'
                  }`
                }
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-[#2E2E2E] p-4">
          <button className="btn-secondary mb-4 w-full" onClick={toggleTheme} title={collapsed ? 'Toggle theme' : undefined}>
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {!collapsed && <span>{isLight ? 'Dark mode' : 'Light mode'}</span>}
          </button>
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <span className="badge mt-1 border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">{user?.role}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              className="btn-secondary mt-4 w-full"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main className={`min-h-screen p-5 transition-all duration-200 md:p-8 ${collapsed ? 'ml-20' : 'ml-60'}`}>
        <div className="animate-fade-in mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
