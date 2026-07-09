import { useState, useCallback, useRef, useEffect } from 'react';
import { useTransit } from '../context/TransitContext';
import { toast } from './Toast';

export default function SearchSection({ onSearch, loading }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { placeNames } = useTransit();
  const datalistRef = useRef(null);

  useEffect(() => {
    if (!datalistRef.current) return;
    datalistRef.current.innerHTML = '';
    (placeNames || []).forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      datalistRef.current.appendChild(opt);
    });
  }, [placeNames]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!from.trim() || !to.trim()) {
        toast('Please enter both From and To', 'error');
        return;
      }
      onSearch({ from: from.trim(), to: to.trim() });
    },
    [from, to, onSearch]
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation not supported', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city || 'My Location';
          setFrom(area);
          toast('Location detected!', 'success');
        } catch {
          setFrom('My Location');
        }
      },
      () => toast('Location access denied', 'error'),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <section className="card">
      <h2 className="m-0 mb-3 text-[1.05rem] font-bold" style={{ color: '#1f2937' }}>Find a low-cost route</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
          <div className="grid gap-1.5 min-w-0">
            <span className="text-[0.82rem] font-bold" style={{ color: '#6b7280' }}>From</span>
            <input
              type="text"
              list="placeSuggestions"
              placeholder="Start point"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="search-input"
            />
            <button
              type="button"
              onClick={handleUseLocation}
              className="loc-btn justify-self-start mt-0.5"
            >
              📍 Use my location
            </button>
          </div>
          <div className="grid gap-1.5 min-w-0">
            <span className="text-[0.82rem] font-bold" style={{ color: '#6b7280' }}>To</span>
            <input
              type="text"
              list="placeSuggestions"
              placeholder="Destination"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary min-w-[112px]"
          >
            {loading ? 'Searching...' : 'Find Route'}
          </button>
        </div>
        <datalist ref={datalistRef} id="placeSuggestions" />
      </form>
    </section>
  );
}
