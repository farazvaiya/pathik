import { useState, useEffect, useCallback } from 'react';
import { createSOS, fetchAlerts, fetchNearbyAlerts, reportSighting, confirmSighting, flagAlert, ALERT_TYPE_LABELS, SEVERITY_COLORS, getAnonUserId } from '../api';
import { toast } from './Toast';

export default function EmergencySection({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [form, setForm] = useState({ message: '', type: 'other', locationName: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported on this device');
      return;
    }
    setLocationLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setLocationLoading(false);
        setLocationError('');
        toast('Location detected!', 'success');
        // Auto-fill location name via reverse geocoding (best-effort)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data?.address) {
            const a = data.address;
            const parts = [a.road, a.neighbourhood || a.suburb || a.village, a.city || a.town || a.district].filter(Boolean);
            if (parts.length > 0) {
              setForm(prev => ({ ...prev, locationName: parts.join(', ') }));
            }
          }
        } catch {
          // Reverse geocoding failed — leave locationName as-is
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) setLocationError('Location permission denied. Please allow GPS access.');
        else if (err.code === 2) setLocationError('Location unavailable. Try again.');
        else setLocationError('Location request timed out. Try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      if (location) {
        const nearby = await fetchNearbyAlerts(location.lat, location.lng, 10);
        setAlerts(nearby);
      } else {
        const { alerts: data } = await fetchAlerts({ limit: 30 });
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
    setLoading(false);
  }, [location]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  async function handleCreateSOS(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    if (!location) {
      toast('Please enable location first', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createSOS({
        message: form.message,
        type: form.type,
        lat: location.lat,
        lng: location.lng,
        locationName: form.locationName,
        isAnonymous: true,
      });
      setForm({ message: '', type: 'other', locationName: '' });
      setShowCreate(false);
      toast('SOS Alert sent! Nearby users will be notified.', 'success');
      loadAlerts();
    } catch (err) {
      toast(err.message || 'Failed to send SOS', 'error');
    }
    setSubmitting(false);
  }

  async function handleSighting(alertId) {
    const desc = prompt('বিস্তারিত লিখুন (ঐচ্ছিক):');
    if (desc === null) return;
    try {
      await reportSighting(alertId, {
        lat: location?.lat || 23.8103,
        lng: location?.lng || 90.4125,
        description: desc || undefined,
        isAnonymous: true,
      });
      toast('Sighting reported!', 'success');
      loadAlerts();
    } catch (err) {
      toast(err.message || 'Failed to report sighting', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-600">🚨 Emergency Alerts</h2>
        <div className="flex gap-2">
          <button onClick={loadAlerts} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">🔄</button>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            {showCreate ? 'বন্ধ করুন' : '+ SOS'}
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateSOS} className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="bg-red-100 text-red-800 text-xs p-2 rounded-lg">
            ⚠️ সতর্কতা: মিথ্যা অ্যালার্ট দেওয়া একটি গুরুতর অপরাধ। ভুয়া জরুরি অ্যালার্টের কারণে জরুরি সেবা বিলম্বিত হতে পারে।
          </div>

          <button type="button" onClick={handleGetLocation} disabled={locationLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition border ${
              location ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
              locationLoading ? 'bg-amber-50 border-amber-300 text-amber-700' :
              'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            {locationLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Detecting location...
              </>
            ) : location ? (
              <>📍 Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (tap to change)</>
            ) : (
              <>📍 Use My Location (required)</>
            )}
          </button>
          {locationError && <p className="text-xs text-red-600">{locationError}</p>}

          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            className="w-full p-2 border rounded-lg text-sm">
            {Object.entries(ALERT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="কী ঘটেছে? বিস্তারিত লিখুন..." rows={3}
            className="w-full p-2 border rounded-lg text-sm" required />
          <input value={form.locationName} onChange={e => setForm({ ...form, locationName: e.target.value })}
            placeholder="স্থানের নাম (ঐচ্ছিক — যেমন: মিরপুর ১০)" className="w-full p-2 border rounded-lg text-sm" />
          <button type="submit" disabled={submitting || !form.message.trim() || !location}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'পাঠানো হচ্ছে...' : '🚨 SOS পাঠান'}
          </button>
          {!location && <p className="text-[11px] text-gray-400 text-center">Location is required so nearby users can be alerted</p>}
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">লোড হচ্ছে...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">কোনো অ্যালার্ট নেই 👍</div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id || alert._id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: SEVERITY_COLORS[alert.severity] }}>
                      {alert.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{ALERT_TYPE_LABELS[alert.type] || alert.type}</span>
                  </div>
                  <p className="text-sm text-gray-800">{alert.originalText}</p>
                  {alert.locationName && <p className="text-xs text-gray-500 mt-1">📍 {alert.locationName}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {alert.sightingCount || 0} সাইটিং • {new Date(alert.createdAt).toLocaleString('bn-BD')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <button onClick={() => handleSighting(alert.id || alert._id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                    👁️ দেখেছি
                  </button>
                  <button onClick={() => flagAlert(alert.id || alert._id, 'মিথ্যা')}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">
                    🚩 ফ্ল্যাগ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
