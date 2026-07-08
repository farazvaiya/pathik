import { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authRegister, authLogout, getStoredUser, storeUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [status, setStatus] = useState('');

  useEffect(() => {
    const handler = (e) => setUser(e.detail || null);
    window.addEventListener('pathik:auth-change', handler);
    return () => window.removeEventListener('pathik:auth-change', handler);
  }, []);

  async function login(email, password) {
    setStatus('Signing in...');
    const data = await authLogin({ email, password });
    const u = { id: data.user.id, email: data.user.email, displayName: data.user.displayName, role: data.user.role };
    storeUser(u);
    setUser(u);
    setStatus('');
    return u;
  }

  async function register(email, password, displayName) {
    setStatus('Creating account...');
    const data = await authRegister({ email, password, displayName });
    const u = { id: data.user.id, email: data.user.email, displayName: data.user.displayName, role: data.user.role };
    storeUser(u);
    setUser(u);
    setStatus('');
    return u;
  }

  async function logout() {
    await authLogout();
    storeUser(null);
    setUser(null);
    setStatus('');
  }

  return (
    <AuthContext.Provider value={{ user, status, setStatus, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
