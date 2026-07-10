import { useState, useEffect, useCallback, useRef } from 'react';
import { useTransit } from '../context/TransitContext';
import { createSOS, fetchAlerts, fetchNearbyAlerts, voteAlert, ALERT_TYPE_LABELS, SEVERITY_COLORS, getAnonUserId, getFeedVotes, setFeedVotes } from '../api';
import { toast } from './Toast';

export default function EmergencySection({ user, onOpenComments }) {
  const { placeNames } = useTransit();
  const sosDatalistRef = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [form, setForm] = useState({ message: '', type: 'other', locationName: '', from: '', to: '' });
  const [submitting, setSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [votes, setVotes] = useState(() => getFeedVotes());

  useEffect(() => {
    if (!sosDatalistRef.current) return;
    sosDatalistRef.current.innerHTML = '';
    (placeNames || []).forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      sosDatalistRef.current.appendChild(opt);
    });
  }, [placeNames]);

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
          // Reverse geocoding failed
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

  function handleMediaSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { toast('Only images and videos allowed', 'error'); return; }
    if (isImage && file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', 'error'); return; }
    if (isVideo && file.size > 20 * 1024 * 1024) { toast('Video must be under 20MB', 'error'); return; }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(isImage ? 'image' : 'video');
  }

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
        from: form.from,
        to: form.to,
        isAnonymous: true,
      }, mediaFile);
      setForm({ message: '', type: 'other', locationName: '', from: '', to: '' });
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setShowCreate(false);
      toast('SOS Alert sent! Nearby users will be notified.', 'success');
      loadAlerts();
    } catch (err) {
      toast(err.message || 'Failed to send SOS', 'error');
    }
    setSubmitting(false);
  }

  const actorId = getAnonUserId();

  async function handleVote(alertId, vote) {
    const key = `${alertId}::${actorId}`;
    const newVotes = { ...votes };
    if (newVotes[key] === vote) {
      delete newVotes[key];
    } else {
      newVotes[key] = vote;
    }
    setVotes(newVotes);
    setFeedVotes(newVotes);
    try {
      await voteAlert(alertId, vote);
      loadAlerts();
    } catch (e) {
      toast('Vote failed', 'error');
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

          <div className="grid grid-cols-2 gap-2">
            <input value={form.from} onChange={e => setForm({ ...form, from: e.target.value })}
              list="sosPlaceSuggestions"
              placeholder="From (ঐচ্ছিক — যেমন: মিরপুর ১০)" className="w-full p-2 border rounded-lg text-sm" />
            <input value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}
              list="sosPlaceSuggestions"
              placeholder="To (ঐচ্ছিক — যেমন: গুলশান ১)" className="w-full p-2 border rounded-lg text-sm" />
          </div>

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

          {/* Media upload */}
          <div className="flex gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition border border-red-200 hover:bg-red-50 text-red-700">
              📷 ছবি/ভিডিও
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleMediaSelect} />
            </label>
          </div>
          {mediaPreview && (
            <div className="relative inline-block">
              {mediaType === 'video' ? (
                <video src={mediaPreview} className="h-24 rounded-lg border border-red-200" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="h-24 rounded-lg object-cover border border-red-200" />
              )}
              <button
                type="button"
                onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); }}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          <button type="submit" disabled={submitting || !form.message.trim() || !location}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'পাঠানো হচ্ছে...' : '🚨 SOS পাঠান'}
          </button>
          {!location && <p className="text-[11px] text-gray-400 text-center">Location is required so nearby users can be alerted</p>}
        </form>
      )}

      <datalist ref={sosDatalistRef} id="sosPlaceSuggestions" />

      {loading ? (
        <div className="text-center py-8 text-gray-500">লোড হচ্ছে...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">কোনো অ্যালার্ট নেই 👍</div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const id = (alert.id || alert._id || '').toString();
            const myVote = votes[`${id}::${actorId}`];
            const feedPostId = (alert.originalPostId || id).toString();

            return (
              <div key={id} className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: SEVERITY_COLORS[alert.severity] }}>
                        {alert.severity?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{ALERT_TYPE_LABELS[alert.type] || alert.type}</span>
                    </div>
                    <p className="text-sm text-gray-800">{alert.originalText}</p>
                    {(alert.from || alert.to) && (
                      <p className="text-xs text-gray-600 mt-1">
                        📍 {alert.from || '?'} → {alert.to || '?'}
                      </p>
                    )}
                    {alert.locationName && <p className="text-xs text-gray-500 mt-1">📍 {alert.locationName}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.createdAt).toLocaleString('bn-BD')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    {onOpenComments && (
                      <button onClick={() => onOpenComments(feedPostId)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                        💬 কমেন্ট
                      </button>
                    )}
                  </div>
                </div>
                {/* Like/Dislike buttons */}
                <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleVote(id, 'up')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.8rem] font-semibold transition border ${
                      myVote === 'up' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-[#f3f4f6] border-[#d1d5db] hover:bg-[#e5e7eb]'
                    }`}
                  >
                    👍 {alert.upvotes || 0}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(id, 'down')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.8rem] font-semibold transition border ${
                      myVote === 'down' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-[#f3f4f6] border-[#d1d5db] hover:bg-[#e5e7eb]'
                    }`}
                  >
                    👎 {alert.downvotes || 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
