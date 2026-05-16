import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, AtSign, CheckCircle2, LockKeyhole, Moon, PanelsTopLeft, Sun, User, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const highlights = ['Project boards', 'Team tasks', 'Deadline tracking'];

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/dashboard');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-[#0F0F0F] text-zinc-100 lg:grid-cols-[1.05fr_0.95fr]">
      <button className="btn-secondary fixed right-4 top-4 z-20 !p-2" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
      <section className="relative hidden overflow-hidden border-r border-[#2E2E2E] bg-[#111111] p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.16),transparent_34%),linear-gradient(315deg,rgba(99,102,241,0.18),transparent_36%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-400 text-[#0F0F0F]">
            <Zap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Track It</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-emerald-300">Team command center</p>
          <h1 className="text-5xl font-bold leading-tight">Plan work, assign ownership, and keep projects moving.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-300">
            A focused workspace for teams that need clear priorities, cleaner boards, and fewer missed handoffs.
          </p>
        </div>

        <div className="relative z-10 grid gap-3">
          {highlights.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span className="text-sm font-medium text-zinc-100">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <main className="grid min-h-screen place-items-center px-4 py-10 sm:px-6">
        <form onSubmit={submit} className="w-full max-w-md animate-fade-in rounded-2xl border border-[#2E2E2E] bg-[#171717] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 text-[#0F0F0F]">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Track It</span>
            </div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <PanelsTopLeft className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {isRegister ? 'Join Track It and start organizing your team workspace.' : 'Sign in to manage projects, tasks, and deadlines.'}
            </p>
          </div>

          <div className="space-y-4">
            {isRegister && (
              <label className="block">
                <span className="label">Name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    className="field pl-10"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                  />
                </div>
              </label>
            )}
            <label className="block">
              <span className="label">Email</span>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  className="field pl-10"
                  type="email"
                  placeholder="admin@test.com"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="label">Password</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  className="field pl-10"
                  type="password"
                  placeholder="Enter password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </div>
            </label>
          </div>

          <button className="btn-primary mt-6 w-full bg-emerald-400 text-[#0F0F0F] hover:bg-emerald-300" disabled={busy}>
            {busy ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-6 text-center text-sm text-zinc-400">
            {isRegister ? 'Already have an account?' : 'New to Track It?'}{' '}
            <Link className="font-medium text-emerald-300 hover:text-emerald-200" to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
