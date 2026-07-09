import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { findRoutes, titleCase } from '../routeEngine';

const TransitContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export function TransitProvider({ children }) {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('dhaka');
  const [placeNames, setPlaceNames] = useState([]);
  const [dataReady, setDataReady] = useState(false);
  const corridorDataRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/transit/data/routes`);
        const data = await res.json();
        if (cancelled) return;
        corridorDataRef.current = data;

        const names = new Set();
        const corridors = Array.isArray(data?.corridors) ? data.corridors : [];
        corridors.forEach((c) => {
          if (c.from) names.add(titleCase(c.from));
          if (c.to) names.add(titleCase(c.to));
          const stops = c.direct?.stops || c.legs?.[0]?.stops || [];
          stops.forEach((s) => names.add(titleCase(s)));
        });
        setPlaceNames([...names].sort());
        setDataReady(true);
      } catch (e) {
        console.warn('[TransitContext] Failed to load corridors:', e.message);
        setDataReady(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const searchRoutes = useCallback(async (from, to) => {
    const fromTrimmed = from.trim();
    const toTrimmed = to.trim();
    if (!fromTrimmed && !toTrimmed) { setRoutes([]); return; }

    setLoading(true);
    setSelectedRoute(null);

    try {
      let corridorData = corridorDataRef.current;
      if (!corridorData) {
        const res = await fetch(`${API_BASE}/api/v1/transit/data/routes`);
        corridorData = await res.json();
        corridorDataRef.current = corridorData;
      }

      const result = findRoutes(fromTrimmed, toTrimmed, corridorData);
      setRoutes(result.routes || []);
      setSearchQuery(`${fromTrimmed} → ${toTrimmed}`);
    } catch (err) {
      console.warn('[TransitContext] search failed:', err.message);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <TransitContext.Provider
      value={{
        routes, setRoutes,
        selectedRoute, setSelectedRoute,
        searchQuery, setSearchQuery,
        loading, setLoading,
        region, setRegion,
        searchRoutes,
        placeNames,
        dataReady,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
}

export function useTransit() {
  const ctx = useContext(TransitContext);
  if (!ctx) throw new Error('useTransit must be used within TransitProvider');
  return ctx;
}
