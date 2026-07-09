import { useState, useEffect } from 'react';

export default function NearbyTransit({ onSelect }) {
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city || '';
          setNearby([
            { name: 'Your Location', area, lat: latitude, lng: longitude },
          ]);
        } catch {
          setError('Could not determine nearby transit');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  if (loading) {
    return (
      <section className="card" style={{ background: '#fafffe', border: '1px solid #bbf7d0' }}>
        <p className="text-[0.9rem]" style={{ color: '#6b7280' }}>Detecting nearby transit...</p>
      </section>
    );
  }

  if (error || nearby.length === 0) return null;

  return (
    <section className="card" style={{ background: '#fafffe', border: '1px solid #bbf7d0' }}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="m-0 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>📍 Nearby Transit Points</h2>
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
            className="w-full text-left grid grid-cols-[1fr_auto_auto] gap-2 items-center px-3 py-2.5 rounded-[10px] border transition"
            style={{ borderColor: '#e5e7eb', background: '#fff' }}
          >
            <span className="font-semibold text-[0.95rem]" style={{ color: '#1f2937' }}>{point.name}</span>
            {point.area && (
              <span className="badge-green">{point.area}</span>
            )}
            <span
              className="px-2.5 py-1 rounded-full text-[0.78rem] font-semibold text-white"
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
