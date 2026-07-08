/**
 * Pathik API Client — Modern Backend (v1 endpoints)
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AUTH_KEY = 'pathik_auth_user_v1';
const TOKEN_KEY = 'pathik_access_token_v1';
const VOTES_KEY = 'pathik_feed_votes_v1';
const ANON_KEY = 'pathik_device_id_v1';

export function getAnonUserId() {
  let uid = localStorage.getItem(ANON_KEY);
  if (!uid) {
    uid = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_KEY, uid);
  }
  return uid;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent('pathik:auth-change', { detail: user }));
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setTokens({ accessToken }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getFeedVotes() {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setFeedVotes(votes) {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

async function apiJson(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { credentials: 'include', ...options, headers });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Invalid server response'); }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function authRegister({ email, password, displayName }) {
  const data = await apiJson(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  setTokens(data.data);
  storeUser(data.data.user);
  return data.data;
}

export async function authLogin({ email, password }) {
  const data = await apiJson(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.data);
  storeUser(data.data.user);
  return data.data;
}

export async function authLogout() {
  try { await apiJson(`${API_BASE}/api/v1/auth/logout`, { method: 'POST' }); } catch {}
  clearTokens();
  storeUser(null);
}

export async function fetchFeed({ page = 1, limit = 30, type, sort } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type && type !== 'all' && type !== 'my') params.set('type', type);
  if (sort) params.set('sort', sort);
  const data = await apiJson(`${API_BASE}/api/v1/feed?${params}`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function createPost(post) {
  const data = await apiJson(`${API_BASE}/api/v1/feed`, {
    method: 'POST',
    body: JSON.stringify(post),
  });
  return data.data || post;
}

export async function votePost(postId, vote) {
  const body = { id: postId, vote, deviceId: getAnonUserId() };
  const data = await apiJson(`${API_BASE}/api/v1/feed/vote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.data;
}

export async function fetchComments(postId) {
  const data = await apiJson(`${API_BASE}/api/v1/feed/comments?postId=${encodeURIComponent(postId)}`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function postComment({ postId, message, parentId }) {
  const data = await apiJson(`${API_BASE}/api/v1/feed/comments`, {
    method: 'POST',
    body: JSON.stringify({ postId, message, parentId: parentId || null, deviceId: getAnonUserId() }),
  });
  return data.data;
}

export async function explainRoute(query, context) {
  return apiJson(`${API_BASE}/api/v1/transit/ai`, {
    method: 'POST',
    body: JSON.stringify({ query, task: 'explain_route', context }),
  });
}

export async function fetchCommunityRoutes({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const data = await apiJson(`${API_BASE}/api/v1/community/routes?${params}`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function createCommunityRoute(route) {
  const data = await apiJson(`${API_BASE}/api/v1/community/routes`, {
    method: 'POST',
    body: JSON.stringify(route),
  });
  return data.data;
}

export async function voteCommunityRoute(routeId, vote) {
  const data = await apiJson(`${API_BASE}/api/v1/community/routes/vote`, {
    method: 'POST',
    body: JSON.stringify({ id: routeId, vote, userId: getAnonUserId() }),
  });
  return data.data;
}

export function getActorId(user) {
  return user?.id || user?._id || user?.userId || getAnonUserId();
}

export function getVerdict(post) {
  const agree = post?.upvotes ?? post?.votes?.agree ?? 0;
  const disagree = post?.downvotes ?? post?.votes?.disagree ?? 0;
  const total = agree + disagree;
  if (total < 2) return 'neutral';
  if (agree / total >= 0.7) return 'verified';
  if (disagree / total >= 0.6) return 'disputed';
  return 'neutral';
}

export function timeAgo(iso) {
  if (!iso) return 'Just now';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const TYPE_LABELS = {
  traffic: '🚦 Traffic',
  accident: '🚑 Accident',
  danger: '⚠️ Danger',
  tip: '💡 Tip',
  event: '📅 Event',
  other: '📢 Update',
};
