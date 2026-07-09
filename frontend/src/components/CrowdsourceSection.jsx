import { useState } from 'react';
import { createCommunityRoute, getAnonUserId } from '../api';
import { toast } from './Toast';

export default function CrowdsourceSection() {
  const [tab, setTab] = useState('addRoute');
  const [form, setForm] = useState({ from: '', to: '', busName: '', fare: '', stops: '' });
  const [submitting, setSubmitting] = useState(false);

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
        authorId: getAnonUserId(),
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
              list="placeSuggestions"
              placeholder="From"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <input
              type="text"
              list="placeSuggestions"
              placeholder="To"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>
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
        <div className="text-center py-6" style={{ color: '#6b7280' }}>
          You haven't submitted any data yet.
        </div>
      )}
    </section>
  );
}
