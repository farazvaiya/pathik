import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFeed, createPost, votePost, getAnonUserId, getVerdict, timeAgo, getFeedVotes, setFeedVotes, TYPE_LABELS } from '../api';
import { toast } from './Toast';

const FEED_TYPES = [
  { id: 'all', label: '🔁 All' },
  { id: 'traffic', label: '🚦 Traffic' },
  { id: 'accident', label: '🚑 Accident' },
  { id: 'danger', label: '⚠️ Danger' },
  { id: 'tip', label: '💡 Tips' },
  { id: 'event', label: '📅 Events' },
];

const POST_TYPES = ['traffic', 'accident', 'danger', 'tip', 'event', 'other'];

export default function FeedSection() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [votes, setVotes] = useState(() => getFeedVotes());
  const [form, setForm] = useState({ from: '', to: '', type: 'tip', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const data = await fetchFeed({ limit: 30, type: filter === 'all' ? undefined : filter });
      setPosts(data);
    } catch (e) {
      console.warn('[FeedSection] load failed:', e.message);
    }
  }, [filter]);

  useEffect(() => {
    loadFeed();
    const onRefresh = () => loadFeed();
    const onOpenForm = () => setShowForm(true);
    window.addEventListener('pathik:feed-refresh', onRefresh);
    window.addEventListener('pathik:open-post-form', onOpenForm);
    return () => {
      window.removeEventListener('pathik:feed-refresh', onRefresh);
      window.removeEventListener('pathik:open-post-form', onOpenForm);
    };
  }, [loadFeed]);

  async function handleVote(postId, vote) {
    const key = `${postId}::${getAnonUserId()}`;
    const newVotes = { ...votes };
    if (newVotes[key] === vote) {
      delete newVotes[key];
    } else {
      newVotes[key] = vote;
    }
    setVotes(newVotes);
    setFeedVotes(newVotes);
    try {
      const updated = await votePost(postId, vote);
      if (updated) setPosts((prev) => prev.map((p) => (p.id === postId || p._id === postId ? { ...p, ...updated } : p)));
    } catch (e) {
      toast('Vote sync failed', 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.message.trim()) { toast('Message is required', 'error'); return; }
    setSubmitting(true);
    try {
      const post = await createPost({
        ...form,
        from: form.from || '',
        to: form.to || '',
        deviceId: getAnonUserId(),
      });
      setPosts((prev) => [post, ...prev]);
      setForm({ from: '', to: '', type: 'tip', message: '' });
      setShowForm(false);
      toast('Post published!', 'success');
      window.dispatchEvent(new CustomEvent('pathik:feed-refresh'));
    } catch (e) {
      toast(e.message || 'Post failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const actorId = getAnonUserId();

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700">📰 Transport News Feed</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-xl"
        >
          + New Post
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-3 border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="From (optional)"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
            <input
              placeholder="To (optional)"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            {POST_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
          <textarea
            rows={2}
            placeholder="Describe the situation..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? 'Posting...' : '📤 Post Update'}
          </button>
        </form>
      )}

      <div className="flex gap-2 flex-wrap mb-3">
        {FEED_TYPES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
              filter === f.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!posts.length && (
          <div className="text-center text-sm text-slate-400 py-8">
            No posts yet. Be the first to post! 🚌
          </div>
        )}
        {posts.slice(0, 30).map((post) => {
          const id = post.id || post._id;
          const verdict = getVerdict(post);
          const myVote = votes[`${id}::${actorId}`];
          const upvotes = post.upvotes ?? post.votes?.agree ?? 0;
          const downvotes = post.downvotes ?? post.votes?.disagree ?? 0;
          const fromDisplay = post.fromDisplay || (post.from ? post.from.replace(/\b\w/g, (c) => c.toUpperCase()) : '');
          const toDisplay = post.toDisplay || (post.to ? post.to.replace(/\b\w/g, (c) => c.toUpperCase()) : '');

          return (
            <div
              key={id}
              className={`rounded-2xl border p-4 ${
                verdict === 'verified' ? 'border-emerald-200 bg-emerald-50/40' :
                verdict === 'disputed' ? 'border-red-200 bg-red-50/30' :
                'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[post.type] || '📢 Update'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  verdict === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                  verdict === 'disputed' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {verdict === 'verified' ? '✅ Verified' : verdict === 'disputed' ? '⚠️ Disputed' : '◐ New'}
                </span>
              </div>
              <p className="text-sm text-slate-800 mb-2">{post.message}</p>
              {(fromDisplay || toDisplay) && (
                <div className="text-xs text-slate-500 mb-2">
                  📍 {fromDisplay}{toDisplay ? ` → ${toDisplay}` : ''}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>🕐 {timeAgo(post.createdAt)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVote(id, 'up')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${myVote === 'up' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100'}`}
                  >
                    👍 {upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(id, 'down')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${myVote === 'down' ? 'bg-red-100 text-red-700' : 'hover:bg-slate-100'}`}
                  >
                    👎 {downvotes}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
