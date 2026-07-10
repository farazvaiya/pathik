import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authLogin, authRegister, authLogout, getStoredUser, storeUser, fetchUserProfile } from '../api';
import { subscribeToPush } from '../hooks/useSocket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [status, setStatus] = useState('');
  const [fullProfile, setFullProfile] = useState(null);

  useEffect(() => {
    const handler = (e) => setUser(e.detail || null);
    window.addEventListener('pathik:auth-change', handler);
    return () => window.removeEventListener('pathik:auth-change', handler);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await fetchUserProfile();
      setFullProfile(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (user?.id) refreshProfile();
    else setFullProfile(null);
  }, [user?.id, refreshProfile]);

  async function login(email, password) {
    setStatus('Signing in...');
    const data = await authLogin({ email, password });
    const u = { id: data.user.id, email: data.user.email, displayName: data.user.displayName, role: data.user.role };
    storeUser(u);
    setUser(u);
    setStatus('');
    // Subscribe to push notifications
    subscribeToPush().catch(() => {});
    return u;
  }

  async function register(email, password, displayName) {
    setStatus('Creating account...');
    const data = await authRegister({ email, password, displayName });
    const u = { id: data.user.id, email: data.user.email, displayName: data.user.displayName, role: data.user.role };
    storeUser(u);
    setUser(u);
    setStatus('');
    // Subscribe to push notifications
    subscribeToPush().catch(() => {});
    return u;
  }

  async function logout() {
    await authLogout();
    storeUser(null);
    setUser(null);
    setFullProfile(null);
    setStatus('');
  }

  return (
    <AuthContext.Provider value={{ user, fullProfile, refreshProfile, status, setStatus, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
