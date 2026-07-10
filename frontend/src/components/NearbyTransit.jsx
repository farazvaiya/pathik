import { useState, useEffect } from 'react';
import { findNearbyStops } from '../routeEngine';

export default function NearbyTransit({ visible, coords, onSelect }) {
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !coords) {
      setNearby([]);
      return;
    }
    setLoading(true);
    try {
      const stops = findNearbyStops(coords.lat, coords.lng, 15);
      setNearby(stops);
    } catch {
      setNearby([]);
    } finally {
      setLoading(false);
    }
  }, [visible, coords]);

  if (!visible || !coords) return null;

  if (loading) {
    return (
      <section className="card" style={{ background: '#fafffe', border: '1px solid #bbf7d0' }}>
        <p className="text-[0.9rem]" style={{ color: '#6b7280' }}>আপনার কাছের ট্রানজিট পয়েন্ট খুঁজছে...</p>
      </section>
    );
  }

  if (nearby.length === 0) return null;

  return (
    <section className="card" style={{ background: '#fafffe', border: '1px solid #bbf7d0' }}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>📍 কাছের ট্রানজিট পয়েন্ট</h2>
        <span className="badge-green">{nearby.length}</span>
      </div>
      <p className="text-[0.9rem] mb-2.5" style={{ color: '#374151' }}>
        আপনার অবস্থান থেকে নিকটবর্তী পাবলিক ট্রান্সপোর্ট পয়েন্টগুলো নিচে দেওয়া হলো।
      </p>
      <div className="grid gap-2 max-h-[400px] overflow-y-auto">
        {nearby.map((point, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect?.(point)}
            className="w-full text-left grid grid-cols-[1fr_auto] gap-2 items-center px-3 py-2.5 rounded-[10px] border transition"
            style={{ borderColor: '#e5e7eb', background: '#fff' }}
          >
            <div>
              <span className="font-semibold text-[0.95rem]" style={{ color: '#1f2937' }}>{point.name}</span>
              <span className="block text-[0.75rem] mt-0.5" style={{ color: '#9ca3af' }}>
                ~{point.distanceKm} km
              </span>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[0.78rem] font-semibold text-white shrink-0"
              style={{ background: '#2E7D32' }}
            >
              Select
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
