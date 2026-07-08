import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

export default function AuthSection() {
  const { user, login, register, logout } = useAuth();
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
    return (
      <section className="bg-white rounded-2xl shadow-lg p-4 border border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">👤 {user.displayName || user.email}</h2>
          <p className="text-xs text-slate-500">Signed in — post & vote enabled</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition"
        >
          Sign Out
        </button>
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
