import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchComments, postComment, timeAgo, getAnonUserId } from '../api';
import { toast } from './Toast';

export default function CommentsPanel({ postId, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentFile, setCommentFile] = useState(null);
  const [commentPreview, setCommentPreview] = useState(null);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(data);
    } catch (e) {
      console.warn('[Comments] load failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() && !commentFile) return;
    setSubmitting(true);
    try {
      await postComment({
        postId,
        message: newComment.trim() || '(media)',
        parentId: replyTo,
        file: commentFile,
      });
      setNewComment('');
      setReplyTo(null);
      setCommentFile(null);
      setCommentPreview(null);
      toast('Comment posted!', 'success');
      await loadComments();
    } catch (err) {
      toast(err.message || 'Comment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { toast('Only images and videos allowed', 'error'); return; }
    if (isImage && file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', 'error'); return; }
    if (isVideo && file.size > 20 * 1024 * 1024) { toast('Video must be under 20MB', 'error'); return; }
    setCommentFile(file);
    setCommentPreview(URL.createObjectURL(file));
  }

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap = {};
  comments.forEach((c) => {
    if (c.parentId) {
      const pid = String(c.parentId);
      if (!repliesMap[pid]) repliesMap[pid] = [];
      repliesMap[pid].push(c);
    }
  });

  function CommentItem({ comment, depth = 0 }) {
    const replies = repliesMap[String(comment.id || comment._id)] || [];
    return (
      <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2 border-slate-100' : ''} py-2`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-700">
            {comment.authorId ? (comment.displayName || '👤 User') : `anon:${(comment.deviceId || '').slice(0, 8)}`}
          </span>
          <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-800">{comment.message}</p>
        {comment.media && comment.mediaType === 'image' && (
          <img src={comment.media} alt="Comment image" className="mt-1 rounded-lg max-h-32 object-cover border border-slate-100" loading="lazy" />
        )}
        {comment.media && comment.mediaType === 'video' && (
          <video src={comment.media} controls className="mt-1 rounded-lg max-h-40 w-full border border-slate-100" />
        )}
        <button
          type="button"
          onClick={() => setReplyTo(replyTo === (comment.id || comment._id) ? null : (comment.id || comment._id))}
          className="text-xs text-emerald-600 font-semibold mt-1 hover:underline"
        >
          {replyTo === comment._id ? 'Cancel reply' : 'Reply'}
        </button>
        {replies.map((r) => (
          <CommentItem key={r.id || r._id} comment={r} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Comments</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="text-center text-sm text-slate-400 py-8">Loading...</div>
          ) : topLevel.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">No comments yet</div>
          ) : (
            topLevel.map((c) => <CommentItem key={c.id || c._id} comment={c} />)
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 space-y-2">
          {replyTo && (
            <div className="text-xs text-emerald-600 font-semibold">
              Replying to comment ✕{' '}
              <button type="button" onClick={() => setReplyTo(null)} className="underline">
                Cancel
              </button>
            </div>
          )}
          {commentPreview && (
            <div className="relative inline-block">
              {commentFile?.type?.startsWith('video/') ? (
                <video src={commentPreview} className="h-20 rounded-lg border" />
              ) : (
                <img src={commentPreview} alt="Preview" className="h-20 rounded-lg object-cover border" />
              )}
              <button
                type="button"
                onClick={() => { setCommentFile(null); setCommentPreview(null); }}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <label className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg" title="Attach photo or video">
              📎
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleFileSelect} />
            </label>
            <input
              type="text"
              placeholder={user ? 'Add a comment...' : 'Comment anonymously...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={submitting || (!newComment.trim() && !commentFile)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
