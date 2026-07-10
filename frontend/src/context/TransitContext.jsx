import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { findRoutes, titleCase, annotateSafetyScores } from '../routeEngine';
import { fetchCommunityRoutes } from '../api';

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

        try {
          const communityResult = await fetchCommunityRoutes({ limit: 1000 });
          const communityRoutes = Array.isArray(communityResult) ? communityResult : [];
          communityRoutes.forEach((r) => {
            if (r.status === 'active') {
              if (r.from) names.add(titleCase(r.fromDisplay || r.from));
              if (r.to) names.add(titleCase(r.toDisplay || r.to));
              (r.stops || []).forEach((s) => names.add(titleCase(s)));
            }
          });
        } catch {
          // community fetch failed, skip
        }

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

      // Merge community routes into corridor data
      let mergedData = corridorData;
      try {
        const communityResult = await fetchCommunityRoutes({ limit: 1000 });
        const communityRoutes = Array.isArray(communityResult) ? communityResult : [];
        console.log('[TransitContext] community routes fetched:', communityRoutes.length);
        if (communityRoutes.length > 0) {
          const existingCorridors = Array.isArray(corridorData?.corridors) ? corridorData.corridors : [];
          const mergedPlaces = { ...(corridorData?.places || {}) };
          const communityCorridors = communityRoutes
            .filter(r => r.status === 'active' && r.from && r.to)
            .map(r => {
              const fromKey = String(r.from || '').trim().toLowerCase();
              const toKey = String(r.to || '').trim().toLowerCase();
              if (fromKey && !mergedPlaces[fromKey]) mergedPlaces[fromKey] = [];
              if (toKey && !mergedPlaces[toKey]) mergedPlaces[toKey] = [];
              return {
                from: fromKey,
                to: toKey,
                source: 'community',
                direct: {
                  mode: 'bus',
                  names: r.busName ? [r.busName] : [],
                  stops: [titleCase(r.fromDisplay || r.from), ...(r.stops || []).map(titleCase), titleCase(r.toDisplay || r.to)],
                },
              };
            });
          console.log('[TransitContext] community corridors merged:', communityCorridors.length, communityCorridors.map(c => `${c.from}→${c.to}`));
          mergedData = {
            corridors: [...existingCorridors, ...communityCorridors],
            places: mergedPlaces,
          };

          setPlaceNames(prev => {
            const nameSet = new Set(prev);
            communityCorridors.forEach(c => {
              nameSet.add(titleCase(c.from));
              nameSet.add(titleCase(c.to));
              (c.direct?.stops || []).forEach(s => nameSet.add(titleCase(s)));
            });
            return [...nameSet].sort();
          });
        }
      } catch (e) {
        console.warn('[TransitContext] community routes fetch failed:', e.message);
      }

      const result = findRoutes(fromTrimmed, toTrimmed, mergedData);
      const routeList = result.routes || [];
      console.log('[TransitContext] search result:', result._source, 'routes:', routeList.length, routeList.map(r => `${r.label}(${r.source})`));
      setRoutes(routeList);
      setSearchQuery(`${fromTrimmed} → ${toTrimmed}`);

      // Non-blocking safety annotation
      if (routeList.length > 0) {
        annotateSafetyScores(routeList).then(annotated => {
          setRoutes([...annotated]);
        }).catch(() => {});
      }
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
