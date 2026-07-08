import { useState } from 'react';
import { createCommunityRoute, voteCommunityRoute, getAnonUserId } from '../api';
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
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
      <h2 className="text-sm font-bold text-slate-700 mb-4">🤝 Crowdsource Transit Data</h2>
      <div className="flex gap-2 mb-4">
        {[{ id: 'addRoute', label: '➕ Add Route' }].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${tab === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            list="placeSuggestions"
            placeholder="From"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="text"
            list="placeSuggestions"
            placeholder="To"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="text"
            placeholder="Bus name"
            value={form.busName}
            onChange={(e) => setForm({ ...form, busName: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            placeholder="Fare ৳"
            value={form.fare}
            onChange={(e) => setForm({ ...form, fare: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <textarea
          rows={2}
          placeholder="Stops (comma separated)"
          value={form.stops}
          onChange={(e) => setForm({ ...form, stops: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : '✅ Submit Route'}
        </button>
      </form>
    </section>
  );
}
