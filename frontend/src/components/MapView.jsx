import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchNearbyPosts, fetchNearbyAlerts, TYPE_LABELS, ALERT_TYPE_LABELS, SEVERITY_COLORS } from '../api';
import { resolveCoords } from '../routeEngine';

const OSRM_CACHE = new Map();

async function fetchOSRMRoute(fromCoords, toCoords, profile, signal) {
  const cacheKey = `${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}`;
  if (OSRM_CACHE.has(cacheKey)) return OSRM_CACHE.get(cacheKey);

  const url = `https://router.project-osrm.org/route/v1/${profile}/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null;
    const coords = data.routes[0].geometry.coordinates;
    OSRM_CACHE.set(cacheKey, coords);
    return coords;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    return null;
  }
}

export default function MapView({ selectedRoute }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef([]);
  const abortRef = useRef(null);
  const [status, setStatus] = useState('Search to preview the road route.');
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const [showPosts, setShowPosts] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

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
    if (!mapInstance.current) return;

    // Cancel previous OSRM fetches
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Clear previous route polylines
    polylineRef.current.forEach((p) => p.remove());
    polylineRef.current = [];

    // Clear previous route markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!selectedRoute) {
      setStatus('Search to preview the road route.');
      return;
    }

    const steps = selectedRoute.steps || [];
    if (steps.length === 0) {
      setStatus('No route data to display.');
      return;
    }

    const modeColors = {
      bus: '#2E7D32',
      ac_bus: '#1565C0',
      metro: '#7B1FA2',
      rickshaw: '#F57C00',
      leguna: '#00838F',
      walking: '#616161',
    };

    const allCoords = [];

    // Draw markers + landmarks (sync, immediate)
    steps.forEach((step, i) => {
      const fromCoords = resolveCoords(step.from);
      const toCoords = resolveCoords(step.to);
      const color = modeColors[step.mode] || '#2E7D32';

      if (fromCoords) {
        const isStart = i === 0;
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${isStart ? '#2E7D32' : color};width:${isStart ? 16 : 12}px;height:${isStart ? 16 : 12}px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:${isStart ? 10 : 8}px;color:white;font-weight:bold">${isStart ? 'A' : ''}</div>`,
          iconSize: [isStart ? 16 : 12, isStart ? 16 : 12],
          iconAnchor: [isStart ? 8 : 6, isStart ? 8 : 6],
        });
        const marker = window.L.marker(fromCoords, { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${step.from}</b>${step.bus_names?.length ? `<br/>🚌 ${step.bus_names.join(', ')}` : ''}`);
        markersRef.current.push(marker);
        allCoords.push(fromCoords);
      }

      if (toCoords) {
        const isEnd = i === steps.length - 1;
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${isEnd ? '#C62828' : color};width:${isEnd ? 16 : 12}px;height:${isEnd ? 16 : 12}px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:${isEnd ? 10 : 8}px;color:white;font-weight:bold">${isEnd ? 'B' : ''}</div>`,
          iconSize: [isEnd ? 16 : 12, isEnd ? 16 : 12],
          iconAnchor: [isEnd ? 8 : 6, isEnd ? 8 : 6],
        });
        const marker = window.L.marker(toCoords, { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${step.to}</b>${isEnd ? ' (Destination)' : ''}`);
        markersRef.current.push(marker);
        allCoords.push(toCoords);
      }

      // Draw intermediate landmark stops
      if (step.landmarks && step.landmarks.length > 0) {
        step.landmarks.forEach((lm) => {
          const lmCoords = resolveCoords(lm);
          if (lmCoords) {
            const icon = window.L.divIcon({
              className: 'custom-marker',
              html: `<div style="background:${color};width:6px;height:6px;border-radius:50%;border:1px solid white;opacity:0.7"></div>`,
              iconSize: [6, 6],
              iconAnchor: [3, 3],
            });
            const m = window.L.marker(lmCoords, { icon })
              .addTo(mapInstance.current)
              .bindPopup(`<small>${lm}</small>`);
            markersRef.current.push(m);
          }
        });
      }
    });

    if (allCoords.length > 0) {
      mapInstance.current.fitBounds(allCoords, { padding: [40, 40] });
      setStatus('');
    } else {
      setStatus('No map coordinates available for this route.');
      return;
    }

    // Fetch OSRM road paths (async, with abort protection)
    async function drawRoadPaths() {
      for (let i = 0; i < steps.length; i++) {
        if (controller.signal.aborted) return;

        const step = steps[i];
        const fromCoords = resolveCoords(step.from);
        const toCoords = resolveCoords(step.to);
        if (!fromCoords || !toCoords) continue;

        const profile = step.mode === 'walking' ? 'walking' : 'driving';
        const roadCoords = await fetchOSRMRoute(fromCoords, toCoords, profile, controller.signal);

        if (controller.signal.aborted) return;

        const color = modeColors[step.mode] || '#2E7D32';

        if (roadCoords && roadCoords.length > 0) {
          // OSRM returns [lng, lat] arrays — Leaflet expects [lat, lng]
          const latLngs = roadCoords.map(c => [c[1], c[0]]);
          const line = window.L.polyline(latLngs, {
            color,
            weight: 5,
            opacity: 0.85,
            dashArray: step.mode === 'walking' ? '6, 8' : null,
          }).addTo(mapInstance.current);
          polylineRef.current.push(line);
        } else {
          // Fallback: straight line
          const line = window.L.polyline([fromCoords, toCoords], {
            color,
            weight: 4,
            opacity: 0.7,
            dashArray: '4, 8',
          }).addTo(mapInstance.current);
          polylineRef.current.push(line);
        }
      }
    }

    drawRoadPaths();

    return () => controller.abort();
  }, [selectedRoute]);

  const handleLocate = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstance.current.setView([latitude, longitude], 14);
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:#2E7D32;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        window.L.marker([latitude, longitude], { icon })
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
