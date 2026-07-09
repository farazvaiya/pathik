import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchFeed, createPost, votePost, deletePost, getAnonUserId, getVerdict, timeAgo, getFeedVotes, setFeedVotes, TYPE_LABELS, SEVERITY_COLORS } from '../api';
import { toast } from './Toast';
import { getSocket } from '../hooks/useSocket';

const FEED_TYPES = [
  { id: 'all', label: '🔁 All' },
  { id: 'traffic', label: '🚦 Jam' },
  { id: 'accident', label: '🚑 Accident' },
  { id: 'danger', label: '⚠️ Danger' },
  { id: 'tip', label: '💡 Tips' },
  { id: 'event', label: '📅 Events' },
];

const POST_TYPES = ['traffic', 'accident', 'danger', 'tip', 'event', 'other'];

const AI_CATEGORY_LABELS = {
  accident: '🚑 Accident', assault: '👊 Assault', robbery: '🔪 Robbery',
  harassment: '⚠️ Harassment', medical: '🏥 Medical', fire: '🔥 Fire',
  missing_person: '🔍 Missing', stolen_vehicle: '🚗 Stolen Vehicle',
  escaped_criminal: '🚨 Escaped Criminal', traffic_jam: '🚦 Traffic Jam',
  toll_extortion: '💰 Extortion', police_checkpost: '👮 Checkpost',
  natural_disaster: '🌊 Disaster', road_hazard: '⛔ Hazard', other: '📢 Other',
};

export default function FeedSection({ onOpenComments }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [votes, setVotes] = useState(() => getFeedVotes());
  const [form, setForm] = useState({ from: '', to: '', type: 'tip', message: '', locationName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

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

    // Real-time new post via socket
    let socket;
    try {
      socket = getSocket();
      socket.on('feed:new_post', (newPost) => {
        setPosts((prev) => {
          // Avoid duplicates
          if (prev.some(p => (p.id || p._id) === (newPost.id || newPost._id))) return prev;
          return [newPost, ...prev];
        });
      });
    } catch {}

    return () => {
      window.removeEventListener('pathik:feed-refresh', onRefresh);
      window.removeEventListener('pathik:open-post-form', onOpenForm);
      if (socket) socket.off('feed:new_post');
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

  async function handleDelete(postId) {
    if (!confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
      toast('Post deleted', 'success');
    } catch (e) {
      toast(e.message || 'Delete failed', 'error');
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
      }, postImage, location);
      setPosts((prev) => [post, ...prev]);
      setForm({ from: '', to: '', type: 'tip', message: '', locationName: '' });
      setPostImage(null);
      setPostImagePreview(null);
      setLocation(null);
      setShowForm(false);
      toast('Post published!', 'success');
      window.dispatchEvent(new CustomEvent('pathik:feed-refresh'));
    } catch (e) {
      toast(e.message || 'Post failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', 'error'); return; }
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  }

  function handleGetLocation() {
    if (!navigator.geolocation) { toast('Geolocation not supported', 'error'); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        toast('Location added!', 'success');
      },
      () => {
        setLocationLoading(false);
        toast('Could not get location', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const actorId = getAnonUserId();

  return (
    <section className="card" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>📰 Transport News Feed</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-secondary text-xs"
        >
          + New Post
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-3 p-3 rounded-[10px] grid gap-2" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="From stop"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              className="search-input text-[0.9rem]"
            />
            <input
              placeholder="To stop"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="search-input text-[0.9rem]"
            />
          </div>
          <input
            placeholder="Location name (e.g. Mirpur 10, Gulshan-1)"
            value={form.locationName}
            onChange={(e) => setForm({ ...form, locationName: e.target.value })}
            className="search-input text-[0.9rem]"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="search-input text-[0.9rem]"
          >
            {POST_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
          <textarea
            rows={2}
            placeholder="Describe the situation... (Bangla or English)"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            className="search-input text-[0.9rem]"
          />
          <div className="flex gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition border border-slate-200 hover:bg-slate-50">
              📷 Photo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                location ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              {locationLoading ? '...' : location ? '📍 Location added' : '📍 Location'}
            </button>
            {location && (
              <button type="button" onClick={() => setLocation(null)} className="text-xs text-red-500 hover:underline">
                Remove
              </button>
            )}
          </div>
          {location && (
            <p className="text-[0.75rem] text-slate-400">GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          )}
          {postImagePreview && (
            <div className="relative inline-block">
              <img src={postImagePreview} alt="Preview" className="h-20 rounded-lg object-cover border" />
              <button
                type="button"
                onClick={() => { setPostImage(null); setPostImagePreview(null); }}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-secondary"
          >
            {submitting ? 'Posting...' : '📤 Post Update'}
          </button>
        </form>
      )}

      <div className="flex gap-1.5 flex-wrap mb-3 pb-2.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
        {FEED_TYPES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`feed-filter ${filter === f.id ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2.5 max-h-[500px] overflow-y-auto">
        {!posts.length && (
          <div className="text-center py-6" style={{ color: '#9ca3af' }}>
            Be the first to post a transport update! 🚌
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
          const isOwner = post.authorId === user?.id || post.deviceId === actorId;
          const aiCategory = post.aiCategory;
          const aiSeverity = post.aiSeverity;

          return (
            <div
              key={id}
              className={`rounded-xl border p-3 transition ${
                verdict === 'verified' ? 'border-emerald-200 bg-emerald-50/40' :
                verdict === 'disputed' ? 'border-red-200 bg-red-50/30' :
                'border-[#e5e7eb] bg-white'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block text-[0.72rem] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                    style={{
                      background: post.type === 'traffic' ? '#fef3c7' : post.type === 'accident' ? '#fce7f3' : post.type === 'danger' ? '#fee2e2' : '#f3f4f6',
                      color: post.type === 'traffic' ? '#92400e' : post.type === 'accident' ? '#9d174d' : post.type === 'danger' ? '#991b1b' : '#374151',
                    }}
                  >
                    {TYPE_LABELS[post.type] || '📢 Update'}
                  </span>
                  {aiCategory && aiCategory !== post.type && (
                    <span className="inline-block text-[0.65rem] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                      }}
                    >
                      AI: {AI_CATEGORY_LABELS[aiCategory] || aiCategory}
                    </span>
                  )}
                  {aiSeverity && aiSeverity !== 'low' && (
                    <span className="inline-block text-[0.65rem] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${SEVERITY_COLORS[aiSeverity]}20`,
                        color: SEVERITY_COLORS[aiSeverity],
                      }}
                    >
                      {aiSeverity.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[0.72rem] font-bold px-2 py-0.5 rounded-full ${
                    verdict === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    verdict === 'disputed' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {verdict === 'verified' ? '✅ Verified' : verdict === 'disputed' ? '⚠️ Disputed' : '◐ New'}
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(id)}
                      className="text-[0.7rem] text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition"
                      title="Delete post"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[0.92rem] mb-2" style={{ color: '#1f2937', lineHeight: 1.5 }}>{post.message}</p>
              {post.image && (
                <img
                  src={post.image}
                  alt="Post image"
                  className="rounded-lg mb-2 max-h-48 object-cover w-full border border-slate-100"
                  loading="lazy"
                />
              )}
              {(fromDisplay || toDisplay || post.locationName) && (
                <div className="text-[0.82rem] mb-2" style={{ color: '#6b7280' }}>
                  📍 {post.locationName || ''}{fromDisplay ? ` ${fromDisplay}` : ''}{toDisplay ? ` → ${toDisplay}` : ''}
                </div>
              )}
              <div className="flex items-center gap-2.5 flex-wrap text-[0.82rem]" style={{ color: '#9ca3af' }}>
                <span>🕐 {timeAgo(post.createdAt)}</span>
                <div className="flex gap-2.5 items-center ml-auto">
                  {onOpenComments && (
                    <button
                      type="button"
                      onClick={() => onOpenComments(id)}
                      className="px-2 py-1 rounded-lg font-semibold hover:bg-slate-100 transition"
                    >
                      💬
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleVote(id, 'up')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.8rem] font-semibold transition border ${
                      myVote === 'up' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-[#f3f4f6] border-[#d1d5db] hover:bg-[#e5e7eb]'
                    }`}
                  >
                    👍 {upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(id, 'down')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.8rem] font-semibold transition border ${
                      myVote === 'down' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-[#f3f4f6] border-[#d1d5db] hover:bg-[#e5e7eb]'
                    }`}
                  >
                    👎 {downvotes}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
