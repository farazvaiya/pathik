import { useState, useEffect, useRef, useCallback } from 'react';
import { useTransit } from '../context/TransitContext';
import { useAuth } from '../context/AuthContext';
import { createCommunityRoute, fetchCommunityRoutes, getAnonUserId } from '../api';
import { toast } from './Toast';

export default function CrowdsourceSection() {
  const { placeNames } = useTransit();
  const { user } = useAuth();
  const csDatalistRef = useRef(null);
  const [tab, setTab] = useState('addRoute');
  const [form, setForm] = useState({ from: '', to: '', busName: '', fare: '', stops: '' });
  const [submitting, setSubmitting] = useState(false);
  const [myRoutes, setMyRoutes] = useState([]);
  const [myRoutesLoading, setMyRoutesLoading] = useState(false);

  useEffect(() => {
    if (!csDatalistRef.current) return;
    csDatalistRef.current.innerHTML = '';
    (placeNames || []).forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      csDatalistRef.current.appendChild(opt);
    });
  }, [placeNames]);

  const loadMyRoutes = useCallback(async () => {
    setMyRoutesLoading(true);
    try {
      const allRoutes = await fetchCommunityRoutes({ limit: 1000 });
      const myId = user?.id || getAnonUserId();
      setMyRoutes(allRoutes.filter((r) => r.authorId === myId || r.userId === myId));
    } catch {
      setMyRoutes([]);
    } finally {
      setMyRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'mySubmissions') loadMyRoutes();
  }, [tab, loadMyRoutes]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.from.trim() || !form.to.trim()) { toast('From and To are required', 'error'); return; }
    setSubmitting(true);
    try {
      await createCommunityRoute({
        from: form.from.trim(),
        to: form.to.trim(),
        busName: form.busName.trim(),
        fare: form.fare ? parseFloat(form.fare) : null,
        stops: form.stops.split(',').map((s) => s.trim()).filter(Boolean),
        authorId: user?.id || getAnonUserId(),
      });
      setForm({ from: '', to: '', busName: '', fare: '', stops: '' });
      toast('Route submitted! Thank you.', 'success');
    } catch (e) {
      toast(e.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
      <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
        <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>🌍 Community Data</h2>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTab('addRoute')}
            className={`tab-btn ${tab === 'addRoute' ? 'active' : ''}`}
          >
            ➕ Add Route
          </button>
          <button
            type="button"
            onClick={() => setTab('mySubmissions')}
            className={`tab-btn ${tab === 'mySubmissions' ? 'active' : ''}`}
          >
            📦 My Submissions
          </button>
        </div>
      </div>

      {tab === 'addRoute' && (
        <form onSubmit={handleSubmit} className="crowd-form grid gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              list="csPlaceSuggestions"
              placeholder="From"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <input
              type="text"
              list="csPlaceSuggestions"
              placeholder="To"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>
          <datalist ref={csDatalistRef} id="csPlaceSuggestions" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Bus name"
              value={form.busName}
              onChange={(e) => setForm({ ...form, busName: e.target.value })}
            />
            <input
              type="number"
              placeholder="Fare ৳"
              min="0"
              value={form.fare}
              onChange={(e) => setForm({ ...form, fare: e.target.value })}
            />
          </div>
          <textarea
            rows={2}
            placeholder="Stops (comma separated)"
            value={form.stops}
            onChange={(e) => setForm({ ...form, stops: e.target.value })}
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn-secondary"
          >
            {submitting ? 'Submitting...' : '✅ Submit Route'}
          </button>
        </form>
      )}

      {tab === 'mySubmissions' && (
        myRoutesLoading ? (
          <div className="text-center py-6" style={{ color: '#6b7280' }}>Loading...</div>
        ) : myRoutes.length === 0 ? (
          <div className="text-center py-6" style={{ color: '#6b7280' }}>
            You haven't submitted any routes yet.
          </div>
        ) : (
          <div className="space-y-2">
            {myRoutes.map((r) => (
              <div key={r.id} className="p-3 rounded-lg bg-white border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {r.fromDisplay || r.from} → {r.toDisplay || r.to}
                    </span>
                    {r.busName && <span className="text-xs text-slate-500 ml-2">🚌 {r.busName}</span>}
                    {r.fare != null && <span className="text-xs text-emerald-600 ml-2">৳{r.fare}</span>}
                  </div>
                  <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-bold ${r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
}
