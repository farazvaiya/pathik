import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchNearbyPosts, fetchNearbyAlerts, TYPE_LABELS, ALERT_TYPE_LABELS, SEVERITY_COLORS } from '../api';

export default function MapView({ selectedRoute }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [status, setStatus] = useState('Search to preview the road route.');
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const [showPosts, setShowPosts] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (mapInstance.current) return;
    if (!window.L || !mapRef.current) return;

    const map = window.L.map(mapRef.current, {
      center: [23.8103, 90.4125],
      zoom: 12,
      zoomControl: true,
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const loadNearbyData = useCallback(async (lat, lng) => {
    try {
      const [posts, alerts] = await Promise.all([
        fetchNearbyPosts(lat, lng, 5).catch(() => []),
        fetchNearbyAlerts(lat, lng, 5).catch(() => []),
      ]);
      setNearbyPosts(posts);
      setNearbyAlerts(alerts);
    } catch (e) {
      console.warn('Failed to load nearby data:', e);
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (showPosts) {
      nearbyPosts.forEach((post) => {
        const loc = post.location?.coordinates;
        if (!loc || !loc[0] || !loc[1]) return;
        const [lng, lat] = loc;
        const typeColor = post.type === 'traffic' ? '#eab308' : post.type === 'accident' ? '#ec4899' : post.type === 'danger' ? '#ef4444' : '#6b7280';
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${typeColor};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const marker = window.L.marker([lat, lng], { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${TYPE_LABELS[post.type] || 'Post'}</b><br/>${post.message?.slice(0, 100) || ''}<br/><small>${post.locationName || ''}</small>`);
        markersRef.current.push(marker);
      });
    }

    if (showAlerts) {
      nearbyAlerts.forEach((alert) => {
        const loc = alert.location?.coordinates;
        if (!loc || !loc[0] || !loc[1]) return;
        const [lng, lat] = loc;
        const color = SEVERITY_COLORS[alert.severity] || '#ef4444';
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:bold">!</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const marker = window.L.marker([lat, lng], { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b style="color:${color}">${ALERT_TYPE_LABELS[alert.type] || alert.type}</b><br/>${alert.originalText?.slice(0, 100) || ''}<br/><small>${alert.locationName || ''} • ${alert.severity?.toUpperCase()}</small>`);
        markersRef.current.push(marker);
      });
    }
  }, [nearbyPosts, nearbyAlerts, showPosts, showAlerts]);

  useEffect(() => {
    if (!mapInstance.current || !selectedRoute) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const stops = selectedRoute.stops || selectedRoute.steps || [];
    const coords = [];

    stops.forEach((stop, i) => {
      if (stop.lat && stop.lng) {
        const marker = window.L.marker([stop.lat, stop.lng])
          .addTo(mapInstance.current)
          .bindPopup(stop.name || `Stop ${i + 1}`);
        markersRef.current.push(marker);
        coords.push([stop.lat, stop.lng]);
      }
    });

    if (coords.length > 0) {
      mapInstance.current.fitBounds(coords, { padding: [30, 30] });
      setStatus('');
    } else {
      setStatus('No map coordinates available for this route.');
    }
  }, [selectedRoute]);

  const handleLocate = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        mapInstance.current.setView([latitude, longitude], 14);
        window.L.marker([latitude, longitude])
          .addTo(mapInstance.current)
          .bindPopup('📍 You are here')
          .openPopup();
        loadNearbyData(latitude, longitude);
      },
      () => setStatus('Could not get your location.'),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <button type="button" onClick={handleLocate} className="btn-secondary text-xs">
          📍 Locate me
        </button>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-[0.75rem] cursor-pointer">
            <input type="checkbox" checked={showPosts} onChange={(e) => setShowPosts(e.target.checked)} className="accent-emerald-600" />
            📰 Posts ({nearbyPosts.length})
          </label>
          <label className="flex items-center gap-1 text-[0.75rem] cursor-pointer">
            <input type="checkbox" checked={showAlerts} onChange={(e) => setShowAlerts(e.target.checked)} className="accent-red-600" />
            🚨 Alerts ({nearbyAlerts.length})
          </label>
        </div>
      </div>
      {status && <div className="text-[0.86rem] mb-2" style={{ color: '#6b7280' }}>{status}</div>}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: '400px', minHeight: '300px' }}
      />
      {(nearbyPosts.length > 0 || nearbyAlerts.length > 0) && (
        <div className="mt-2 flex gap-3 flex-wrap text-[0.72rem] text-slate-500">
          <span>📰 {nearbyPosts.length} posts nearby</span>
          <span>🚨 {nearbyAlerts.length} alerts nearby</span>
        </div>
      )}
    </div>
  );
}
