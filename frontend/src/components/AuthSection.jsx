import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

export default function AuthSection() {
  const { user, fullProfile, login, register, logout } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading('...');
    try {
      if (mode === 'signup') {
        await register(email.trim(), password, displayName.trim());
        toast('Account created!', 'success');
      } else {
        await login(email.trim(), password);
        toast('Signed in!', 'success');
      }
      setEmail(''); setPassword(''); setDisplayName('');
    } catch (err) {
      toast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading('');
    }
  }

  if (user) {
    const trust = fullProfile?.trustScore ?? 0.5;
    const totalReports = fullProfile?.totalReports ?? 0;
    const verifiedReports = fullProfile?.verifiedReports ?? 0;
    const trustPercent = Math.round(trust * 100);
    const trustColor = trust >= 0.7 ? '#22c55e' : trust >= 0.4 ? '#eab308' : '#ef4444';

    return (
      <section className="bg-white rounded-2xl shadow-lg p-4 border border-slate-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: trustColor }}>
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 m-0">{user.displayName || user.email}</h2>
              <p className="text-xs text-slate-500 m-0">{user.email} • {user.role || 'user'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-slate-50">
            <div className="text-lg font-bold" style={{ color: trustColor }}>{trustPercent}%</div>
            <div className="text-[10px] text-slate-500">Trust Score</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-50">
            <div className="text-lg font-bold text-slate-700">{totalReports}</div>
            <div className="text-[10px] text-slate-500">Reports</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-50">
            <div className="text-lg font-bold text-emerald-600">{verifiedReports}</div>
            <div className="text-[10px] text-slate-500">Verified</div>
          </div>
        </div>

        <div className="mt-2">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${trustPercent}%`, background: trustColor }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-center">Trust builds with verified reports</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-bold text-slate-800">
          {mode === 'signup' ? '📝 Create Account' : '🔐 Sign In'}
        </h2>
        <button
          type="button"
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
        >
          {mode === 'signup' ? 'Have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!!loading}
          className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
    </section>
  );
}
