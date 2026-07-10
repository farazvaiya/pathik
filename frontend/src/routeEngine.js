/**
 * Pathik Route Engine — ported from the GitHub vanilla JS version.
 * Pure functions: takes corridorData + query, returns route results.
 */

const FARE_TABLE = {
  bus:      { perKm: 2.45, base: 0,  min: 10, max: null },
  ac_bus:   { perKm: 5.00, base: 0,  min: 20, max: null },
  metro:    { perKm: 5.00, base: 20, min: 20, max: 100 },
  rickshaw: { perKm: 15,   base: 20, min: 20, max: null },
  leguna:   { perKm: 3.5,  base: 5,  min: 10, max: 25 },
  walking:  { perKm: 0,    base: 0,  min: 0,  max: 0 },
};

const METRO_STATIONS = [
  'uttara north','uttara center','uttara south','pallabi','mirpur 11','mirpur 10',
  'kazipara','shewrapara','agargaon','bijoy sarani','farmgate','karwan bazar',
  'shahbag','dhaka university','bangladesh secretariat','motijheel','kamalapur',
];

const KNOWN_COORDS = {
  'dhaka': [23.8103, 90.4125], 'airport': [23.8510, 90.4005], 'uttara': [23.8759, 90.3795],
  'mirpur 1': [23.7956, 90.3537], 'mirpur 10': [23.8069, 90.3685], 'mirpur 12': [23.8260, 90.3650],
  'farmgate': [23.7561, 90.3872], 'gulshan': [23.7925, 90.4078], 'dhanmondi': [23.7461, 90.3742],
  'motijheel': [23.7333, 90.4172], 'shahbag': [23.7380, 90.3950], 'kamalapur': [23.7372, 90.4250],
  'bashundhara': [23.8136, 90.4254], 'notun bazar': [23.7937, 90.4253], 'badda': [23.7807, 90.4257],
  'rampura': [23.7635, 90.4258], 'banasree': [23.7565, 90.4310], 'abdullahpur': [23.8775, 90.4029],
  'gabtoli': [23.7793, 90.3389], 'savar': [23.8583, 90.2667], 'hemayetpur': [23.7833, 90.2614],
  'mohakhali': [23.7787, 90.4054], 'banani': [23.7937, 90.4066], 'mirpur': [23.8042, 90.3664],
  'mohammadpur': [23.7660, 90.3597], 'adabor': [23.7680, 90.3580], 'shyamoli': [23.7740, 90.3622],
  'kallyanpur': [23.7850, 90.3550], 'technical': [23.7730, 90.3510], 'nandan park': [23.9106, 90.2762],
  'baipayl': [23.9095, 90.2746], 'nobinagar': [23.8829, 90.2589], 'tongi': [23.8917, 90.4067],
  'gazipur chourasta': [23.9999, 90.4203], 'jatrabari': [23.7100, 90.4347], 'sayedabad': [23.7106, 90.4287],
  'chittagong road': [23.7000, 90.4920], 'sign board': [23.6900, 90.4950], 'demra staff quarter': [23.7200, 90.4650],
  'agargaon': [23.7772, 90.3792], 'bijoy sarani': [23.7650, 90.3850], 'kawran bazar': [23.7520, 90.3940],
  'malibagh': [23.7484, 90.4143], 'mouchak': [23.7510, 90.4200], 'gulistan': [23.7268, 90.4119],
  'gpo': [23.7330, 90.4080], 'paltan': [23.7340, 90.4110], 'new market': [23.7370, 90.3700],
  'nilkhet': [23.7300, 90.3700], 'azimpur': [23.7282, 90.3859], 'city college': [23.7400, 90.3700],
  'shukrabad': [23.7460, 90.3720], 'dhanmondi 27': [23.7461, 90.3742], 'dhanmondi 32': [23.7480, 90.3730],
  'science lab': [23.7380, 90.3700], 'katabon': [23.7370, 90.3800], 'shia masjid': [23.7620, 90.3530],
  'japan garden city': [23.7580, 90.3520], 'ring road': [23.7580, 90.3530], 'sony cinema hall': [23.8000, 90.3570],
  'chiriyakhana': [23.8000, 90.3570], 'ashulia': [23.9007, 90.2933], 'zirabo': [23.8950, 90.2850],
  'fantasy kingdom': [23.9106, 90.2762], 'vashantek': [23.8100, 90.3650], 'kachukhet': [23.8050, 90.3750],
  'cantonment': [23.8050, 90.3750], 'police plaza': [23.7925, 90.4078], 'gulshan 2': [23.7925, 90.4100],
  'gulshan 1': [23.7925, 90.4078], 'ecb square': [23.8200, 90.3800], 'kalshi': [23.8244, 90.3814],
  'purobi': [23.8200, 90.3750], 'pallabi': [23.8200, 90.3750], 'mirpur 11': [23.8150, 90.3700],
  'mirpur 14': [23.8170, 90.3784], 'mirpur 2': [23.8020, 90.3600], 'mes': [23.8150, 90.3800],
  'shewra': [23.8200, 90.3900], 'kuril bishwa road': [23.8203, 90.4193], 'khilkhet': [23.8295, 90.4204],
  'shahjadpur': [23.7895, 90.4233], 'uttar badda': [23.7850, 90.4250], 'bashtola': [23.7900, 90.4250],
  'nadda': [23.8000, 90.4250], 'jamuna future park': [23.8150, 90.4200], 'house building': [23.8700, 90.4050],
  'azampur': [23.8750, 90.4050], 'rajendrapur': [23.6500, 90.5000], 'maowa': [23.6700, 90.4200],
  'keraniganj': [23.6850, 90.4006], 'postagola': [23.7028, 90.4170], 'dholairpar': [23.7050, 90.4200],
  'shanir akhra': [23.6950, 90.4950], 'shonir akhra': [23.6950, 90.4950], 'kamrangirchar': [23.7150, 90.3850],
  'sadarghat': [23.7066, 90.4105], 'ray saheb bazar': [23.7150, 90.4050], 'naya bazar': [23.7200, 90.4050],
  'babubazar': [23.7200, 90.4100], 'bakshi bazar': [23.7250, 90.3950], 'kakrail': [23.7300, 90.4150],
  'shantinagar': [23.7300, 90.4200], 'mogbazar': [23.7500, 90.4050], 'wireless': [23.7800, 90.4050],
  'chairman bari': [23.7800, 90.4050], 'sainik club': [23.7900, 90.4050], 'staff road': [23.8000, 90.4000],
  'jashimuddin': [23.8700, 90.4050], 'jashimuddin (uttara)': [23.8700, 90.4050], 'rajlakshmi': [23.8750, 90.4050],
  'kamarpara': [23.8918, 90.3990], 'demra': [23.7155, 90.4710], 'vulta': [23.7700, 90.5430],
  'narayanganj': [23.6238, 90.5000], 'kanchpur': [23.7000, 90.4920], 'matuail': [23.6950, 90.4950],
  'rayerbag': [23.6900, 90.4950], 'bashabo': [23.7470, 90.4350], 'khilgaon': [23.7600, 90.4350],
  'shahbag': [23.7380, 90.3950], 'high court': [23.7340, 90.4100], 'press club': [23.7340, 90.4100],
  'matsya bhaban': [23.7350, 90.3980], 'bangla motor': [23.7500, 90.3940], 'nabisco': [23.7600, 90.4000],
  'satrasta': [23.7550, 90.4000], 'malibagh railgate': [23.7500, 90.4180], 'hazipara': [23.7550, 90.4200],
  'rampura bazar': [23.7600, 90.4220], 'rampura bridge': [23.7635, 90.4258], 'merul': [23.7700, 90.4250],
  'madhya badda': [23.7750, 90.4250], 'badda link road': [23.7800, 90.4250],
  'dhanmondi 15': [23.7450, 90.3720], 'jigatola': [23.7430, 90.3700], 'star kabab': [23.7450, 90.3720],
  'shankar': [23.7500, 90.3600], 'eden college': [23.7350, 90.3700], 'darussalam': [23.7700, 90.3500],
  'bangla college': [23.7750, 90.3500], 'tolarbag': [23.7750, 90.3450], 'ansar camp': [23.7800, 90.3500],
  'kazipara': [23.8100, 90.3700], 'shewrapara': [23.8080, 90.3720], 'taltola': [23.8050, 90.3750],
  'kolabagan': [23.7450, 90.3750], 'kalabagan': [23.7450, 90.3750], 'panthapath': [23.7500, 90.3900],
  'monipur': [23.8000, 90.3650], 'kuril chourasta': [23.8200, 90.4200], 'kuril flyover': [23.8200, 90.4200],
  'beribadh': [23.8500, 90.3200], 'birulia': [23.8600, 90.3100], 'rupnagar': [23.8500, 90.3200],
  'mazar road': [23.8400, 90.3100], 'konabari': [23.8800, 90.3500], 'chandra': [24.0394, 90.2840],
  'kanchan bridge': [23.7800, 90.5200], 'nila market': [23.7900, 90.5300], '300 feet': [23.8000, 90.5400],
  'bashundhara (300 feet gate)': [23.8050, 90.5450], 'diabari': [23.8800, 90.4000],
  'shib bari': [23.9200, 90.4200], 'board bazar': [23.9500, 90.4200], 'gazipur bypass': [23.9600, 90.4200],
  'station road': [23.9000, 90.4100], 'mill gate': [23.9100, 90.4100],
};

export function titleCase(s) {
  return String(s || '').split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
}

function haversineKm(p1, p2) {
  if (!p1 || !p2) return null;
  const toRad = d => d * Math.PI / 180;
  const [lat1, lon1] = p1, [lat2, lon2] = p2;
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function computeFareForLeg(mode, distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return { fare: 10, fare_range: '৳10', computed: false };
  const table = FARE_TABLE[mode] || FARE_TABLE.bus;
  const raw = Math.round(distanceKm * table.perKm + table.base);
  const fare = Math.max(table.min, table.max ? Math.min(table.max, raw) : raw);
  const lo = Math.max(table.min, Math.round(fare * 0.9));
  const hi = table.max ? Math.min(table.max, Math.round(fare * 1.1)) : Math.round(fare * 1.1);
  return { fare, fare_range: lo === hi ? `৳${fare}` : `৳${lo}–${hi}`, computed: true };
}

function estimateTimeMinutes(mode, distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const speedKmh = { bus: 15, ac_bus: 18, metro: 35, rickshaw: 10, leguna: 18, walking: 4.5 }[String(mode || 'bus').toLowerCase()] || 15;
  return Math.round((distanceKm / speedKmh) * 60);
}

function resolveCoords(placeName) {
  const key = String(placeName || '').trim().toLowerCase();
  if (KNOWN_COORDS[key]) return KNOWN_COORDS[key];
  const matched = Object.keys(KNOWN_COORDS).find(k => key.includes(k) || k.includes(key));
  if (matched) return KNOWN_COORDS[matched];
  const baseLat = 23.8103, baseLng = 90.4125;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h) + key.charCodeAt(i);
  return [baseLat + ((h % 1000) / 1000) * 0.18 - 0.09, baseLng + ((((h / 7) % 1000) / 1000) * 0.22) - 0.11];
}

function normalizePlace(text, places) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return t;
  if (places[t]) return t;
  for (const [c, aliases] of Object.entries(places || {})) {
    if (c === t) return c;
    if (Array.isArray(aliases)) for (const a of aliases) if (t === String(a).toLowerCase()) return c;
  }
  for (const [c, aliases] of Object.entries(places || {})) {
    if (t.includes(c)) return c;
    if (Array.isArray(aliases)) for (const a of aliases) { const al = String(a).toLowerCase(); if (t.includes(al) || al.includes(t)) return c; }
  }
  return t;
}

function stopMatchesPlace(stopName, placeName, places) {
  const s = String(stopName || '').toLowerCase().trim();
  const p = String(placeName || '').toLowerCase().trim();
  if (!s || !p) return false;
  if (s === p) return true;
  if (s.includes(p) || p.includes(s)) return true;
  const aliases = places?.[p] || [];
  for (const a of aliases) { const al = String(a).toLowerCase(); if (s === al || s.includes(al) || al.includes(s)) return true; }
  for (const [canonical, al] of Object.entries(places || {})) {
    if (!Array.isArray(al)) continue;
    if (al.some(x => String(x).toLowerCase() === p)) { if (canonical === s) return true; }
  }
  return false;
}

function normalizeStopName(name) {
  return String(name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function routeOverlapScore(aStops, bStops) {
  const a = new Set((aStops || []).map(normalizeStopName).filter(Boolean));
  const b = new Set((bStops || []).map(normalizeStopName).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let common = 0;
  a.forEach(s => { if (b.has(s)) common++; });
  return common / Math.max(a.size, b.size);
}

function groupSimilarMatches(matches) {
  const groups = [];
  (matches || []).forEach((m) => {
    const existing = groups.find(g => {
      if (g.rep.source === 'community' && m.source === 'community') {
        return g.rep.from === m.from && g.rep.to === m.to;
      }
      return g.rep.source === m.source && routeOverlapScore(g.rep.subStops, m.subStops) >= 0.35;
    });
    if (existing) {
      existing.items.push(m);
      existing.rep.names = [...new Set([...existing.rep.names, ...m.names])];
      if (m.stopsBetween < existing.rep.stopsBetween) { const names = existing.rep.names; existing.rep = { ...m, names }; }
    } else {
      groups.push({ rep: { ...m, names: [...new Set(m.names || [])] }, items: [m] });
    }
  });
  return groups
    .map(g => ({ ...g.rep, names: [...new Set(g.items.flatMap(x => x.names || []))] }))
    .sort((a, b) => a.stopsBetween - b.stopsBetween);
}

function getMetroStationName(place, places) {
  const p = normalizePlace(place, places);
  for (const s of METRO_STATIONS) {
    if (p === s) return titleCase(s);
    if (p.includes(s)) return titleCase(s);
    if (s.includes(p) && p.length > 3) return titleCase(s);
  }
  if (p === 'uttara') return 'Uttara North';
  if (p === 'du') return 'Dhaka University';
  return null;
}

function metroStationsBetween(s1, s2) {
  const idx1 = METRO_STATIONS.indexOf(s1.toLowerCase());
  const idx2 = METRO_STATIONS.indexOf(s2.toLowerCase());
  if (idx1 < 0 || idx2 < 0) return 0;
  return Math.abs(idx1 - idx2);
}

function makeMetroStep(fromStation, toStation) {
  let metroCost = 60, metroTime = 25;
  const stops = metroStationsBetween(fromStation, toStation);
  metroTime = Math.max(5, stops * 2 + 5);
  return {
    mode: 'metro', icon: '🚇', from: titleCase(fromStation), to: titleCase(toStation),
    bus_names: [], landmarks: [],
    cost: metroCost, cost_range: `৳${metroCost}`,
    time_minutes: metroTime, time_range: `${Math.max(5, metroTime - 3)}–${metroTime + 5} মিনিট`,
  };
}

function makePublicBusStep(match, fromLbl, toLbl) {
  const mode = match.mode || 'bus';
  const fromCoords = resolveCoords(fromLbl);
  const toCoords = resolveCoords(toLbl);
  const distKm = haversineKm(fromCoords, toCoords);
  const calc = computeFareForLeg(mode, distKm);
  const time = estimateTimeMinutes(mode, distKm);
  const names = (Array.isArray(match.names) && match.names.length) ? match.names : (Array.isArray(match.corridor?.direct?.names) ? match.corridor.direct.names : []);
  return {
    mode, icon: mode === 'metro' ? '🚇' : mode === 'walking' ? '🚶' : '🚌',
    from: titleCase(fromLbl), to: titleCase(toLbl),
    bus_names: [...new Set(names)], landmarks: (match.subStops || []).slice(0, 8),
    cost: calc.fare, cost_range: calc.fare_range,
    time_minutes: time, time_range: `${Math.max(5, time - 5)}–${time + 10} মিনিট`,
    distance_km: distKm ? Number(distKm.toFixed(2)) : null,
  };
}

function buildMetroOption(origin, destination, distKm, places) {
  const oStationRaw = getMetroStationName(origin, places);
  const dStationRaw = getMetroStationName(destination, places);
  if (!oStationRaw && !dStationRaw) return null;
  const oStation = oStationRaw || getMetroStationName(`${origin} metro`, places);
  const dStation = dStationRaw || getMetroStationName(`${destination} metro`, places);
  if (oStation && dStation) {
    const m = makeMetroStep(oStation, dStation);
    return { id: 0, label: 'MRT-6 Metro Direct', total_cost: m.cost, total_cost_range: m.cost_range, total_time_minutes: m.time_minutes, total_time_range: m.time_range, steps: [m] };
  }
  return null;
}

function findRouteFromStops(originRaw, destRaw, corridorData) {
  if (!corridorData || !Array.isArray(corridorData.corridors)) return null;
  const places = corridorData.places || {};
  const o = normalizePlace(originRaw, places);
  const d = normalizePlace(destRaw, places);
  if (!o || !d || o === d) return null;
  const matches = [];
  const scan = (leg, corridor, legLabel) => {
    if (!leg || !Array.isArray(leg.stops) || leg.stops.length < 2) return;
    let oi = -1, di = -1;
    for (let i = 0; i < leg.stops.length; i++) {
      if (oi < 0 && stopMatchesPlace(leg.stops[i], o, places)) oi = i;
      if (di < 0 && stopMatchesPlace(leg.stops[i], d, places)) di = i;
    }
    if (oi < 0 || di < 0 || oi === di) return;
    const rev = oi > di;
    const lo = Math.min(oi, di), hi = Math.max(oi, di);
    const sub = leg.stops.slice(lo, hi + 1);
    matches.push({
      corridor, leg, legLabel, subStops: rev ? [...sub].reverse() : sub,
      stopsBetween: hi - lo,
      names: (Array.isArray(leg.names) && leg.names.length) ? leg.names : (Array.isArray(corridor.direct?.names) ? corridor.direct.names : []),
      mode: leg.mode || 'bus',
      source: corridor?.source || 'local',
      from: corridor?.from,
      to: corridor?.to,
    });
  };
  corridorData.corridors.forEach(c => {
    if (c.direct) scan(c.direct, c, 'direct');
    if (c.interchange) {
      if (c.interchange.leg1) scan(c.interchange.leg1, c, 'leg1');
      if (c.interchange.leg2) scan(c.interchange.leg2, c, 'leg2');
    }
  });
  if (!matches.length) return null;
  const seen = new Set();
  const unique = [];
  matches.forEach(m => {
    const k = (m.names.join('|') || m.mode) + '::' + m.stopsBetween;
    if (!seen.has(k)) { seen.add(k); unique.push(m); }
  });
  unique.sort((a, b) => a.stopsBetween - b.stopsBetween);
  return { matches: unique, origin: o, destination: d };
}

function findBestTransferRoutes(originRaw, destRaw, corridorData, usedBusNames = new Set(), limit = 2) {
  if (!corridorData || !Array.isArray(corridorData.corridors)) return null;
  const places = corridorData.places || {};
  const o = normalizePlace(originRaw, places);
  const d = normalizePlace(destRaw, places);
  const starts = [], ends = [];
  const scan = (leg, corridor, target, out, direction) => {
    if (!leg || !Array.isArray(leg.stops) || leg.stops.length < 3) return;
    const names = (Array.isArray(leg.names) && leg.names.length) ? leg.names : (Array.isArray(corridor.direct?.names) ? corridor.direct.names : []);
    if (names.some(n => usedBusNames.has(n))) return;
    let idx = -1;
    for (let i = 0; i < leg.stops.length; i++) if (idx < 0 && stopMatchesPlace(leg.stops[i], target, places)) idx = i;
    if (idx < 0) return;
    if (direction === 'from') {
      for (let j = 0; j < leg.stops.length; j++) {
        if (j === idx) continue;
        const lo = Math.min(idx, j), hi = Math.max(idx, j);
        const sub = leg.stops.slice(lo, hi + 1);
        out.push({ corridor, leg, names, mode: leg.mode || 'bus', hub: normalizeStopName(leg.stops[j]), subStops: idx > j ? [...sub].reverse() : sub, stopsBetween: Math.abs(idx - j) });
      }
    } else {
      for (let i = 0; i < leg.stops.length; i++) {
        if (i === idx) continue;
        const lo = Math.min(i, idx), hi = Math.max(i, idx);
        const sub = leg.stops.slice(lo, hi + 1);
        out.push({ corridor, leg, names, mode: leg.mode || 'bus', hub: normalizeStopName(leg.stops[i]), subStops: i > idx ? [...sub].reverse() : sub, stopsBetween: Math.abs(i - idx) });
      }
    }
  };
  corridorData.corridors.forEach(c => {
    if (c.direct) {
      scan(c.direct, c, o, starts, 'from');
      scan(c.direct, c, d, ends, 'to');
    }
  });
  const candidates = [];
  const endByHub = new Map();
  ends.forEach(e => {
    if (!endByHub.has(e.hub)) endByHub.set(e.hub, []);
    endByHub.get(e.hub).push(e);
  });
  endByHub.forEach(list => list.sort((a, b) => a.stopsBetween - b.stopsBetween));
  starts.forEach(s => {
    const hubEnds = endByHub.get(s.hub) || [];
    hubEnds.forEach(e => {
      const sameBus = s.names.some(n => e.names.includes(n));
      if (sameBus) return;
      const totalStops = s.stopsBetween + e.stopsBetween;
      candidates.push({ first: s, second: e, hub: s.hub, totalStops });
    });
  });
  const grouped = [];
  candidates.forEach(c => {
    const existing = grouped.find(g => g.rep.hub === c.hub && g.rep.totalStops <= c.totalStops);
    if (existing) existing.items.push(c);
    else grouped.push({ rep: c, items: [c] });
  });
  return grouped.map(g => g.rep).sort((a, b) => a.totalStops - b.totalStops).slice(0, limit);
}

function buildRoutesFromStopMatch(match, originDisplay, destinationDisplay, corridorData) {
  const places = corridorData?.places || {};
  const origin = titleCase(originDisplay || match.origin);
  const destination = titleCase(destinationDisplay || match.destination);
  const fromCoords = resolveCoords(origin);
  const toCoords = resolveCoords(destination);
  const distKm = haversineKm(fromCoords, toCoords);
  const routes = [];
  const grouped = groupSimilarMatches(match.matches);

  const best = grouped[0];
  if (best) {
    const similarGroups = grouped.filter(g => routeOverlapScore(g.subStops, best.subStops) >= 0.45);
    const mergedDirect = { ...best, names: [...new Set(similarGroups.flatMap(g => g.names || []))] };
    const step = makePublicBusStep(mergedDirect, origin, destination);
    routes.push({ id: 1, label: 'Direct Bus', total_cost: step.cost, total_cost_range: step.cost_range, total_time_minutes: step.time_minutes, total_time_range: step.time_range, steps: [step], source: best.source || 'local' });
  }

  const metroOpt = buildMetroOption(origin, destination, distKm, places);
  if (metroOpt) { metroOpt.source = 'local'; routes.push(metroOpt); }

  const altPath = grouped.find((m, i) => i > 0 && routeOverlapScore(m.subStops, best?.subStops || []) < 0.3);
  if (altPath && routes.length < 3) {
    const altStep = makePublicBusStep(altPath, origin, destination);
    routes.push({ id: routes.length + 1, label: 'Alternative Path', total_cost: altStep.cost, total_cost_range: altStep.cost_range, total_time_minutes: altStep.time_minutes, total_time_range: altStep.time_range, steps: [altStep], source: altPath.source || 'local' });
  }

  const usedBusNames = new Set(routes.flatMap(r => r.steps.flatMap(s => s.bus_names || [])));
  const transfers = findBestTransferRoutes(match.origin, match.destination, corridorData, usedBusNames, 12) || [];
  const usedHubs = new Set();
  transfers.forEach((transfer) => {
    if (routes.length >= 7) return;
    if (usedHubs.has(transfer.hub)) return;
    usedHubs.add(transfer.hub);
    const hub = titleCase(transfer.hub);
    const first = makePublicBusStep(transfer.first, origin, hub);
    const second = makePublicBusStep(transfer.second, hub, destination);
    const total = first.cost + second.cost;
    const totalTime = first.time_minutes + second.time_minutes;
    routes.push({
      id: routes.length + 1, label: `Bus Change via ${hub}`,
      total_cost: total, total_cost_range: `৳${Math.max(10, total - 10)}–${total + 15}`,
      total_time_minutes: totalTime, total_time_range: `${Math.max(10, totalTime - 8)}–${totalTime + 15} মিনিট`,
      steps: [first, second],
      source: 'local',
    });
  });

  routes.forEach((r, i) => {
    r.id = i + 1;
    r.origin = origin;
    r.destination = destination;
  });
  return { origin, destination, routes: routes.slice(0, 8), _source: 'stop_search' };
}

export function findRoutes(origin, destination, corridorData) {
  if (!corridorData || !corridorData.corridors) return { origin, destination, routes: [], _source: 'empty' };
  const match = findRouteFromStops(origin, destination, corridorData);
  if (match && match.matches.length > 0) {
    return buildRoutesFromStopMatch(match, origin, destination, corridorData);
  }
  // Fallback: try transfer routes even when no direct corridor connects both stops
  const places = corridorData.places || {};
  const o = normalizePlace(origin, places);
  const d = normalizePlace(destination, places);
  if (!o || !d || o === d) return { origin, destination, routes: [], _source: 'no_match' };

  const transfers = findBestTransferRoutes(origin, destination, corridorData, new Set(), 5);
  if (transfers && transfers.length > 0) {
    const originLabel = titleCase(origin);
    const destinationLabel = titleCase(destination);
    const routes = [];
    const usedHubs = new Set();
    transfers.forEach((transfer) => {
      if (routes.length >= 5) return;
      if (usedHubs.has(transfer.hub)) return;
      usedHubs.add(transfer.hub);
      const hub = titleCase(transfer.hub);
      const first = makePublicBusStep(transfer.first, originLabel, hub);
      const second = makePublicBusStep(transfer.second, hub, destinationLabel);
      const total = first.cost + second.cost;
      const totalTime = first.time_minutes + second.time_minutes;
      routes.push({
        id: routes.length + 1, label: `Bus Change via ${hub}`,
        total_cost: total, total_cost_range: `৳${Math.max(10, total - 10)}–${total + 15}`,
        total_time_minutes: totalTime, total_time_range: `${Math.max(10, totalTime - 8)}–${totalTime + 15} মিনিট`,
        steps: [first, second],
        source: 'local',
      });
    });
    if (routes.length > 0) {
      routes.forEach((r, i) => { r.id = i + 1; r.origin = originLabel; r.destination = destinationLabel; });
      return { origin: originLabel, destination: destinationLabel, routes: routes.slice(0, 8), _source: 'transfer_search' };
    }
  }
  return { origin, destination, routes: [], _source: 'no_match' };
}

export { KNOWN_COORDS, haversineKm, resolveCoords };

export function findNearbyStops(userLat, userLng, maxKm = 15) {
  const results = [];
  for (const [name, coords] of Object.entries(KNOWN_COORDS)) {
    const dist = haversineKm([userLat, userLng], coords);
    if (dist !== null && dist > 0 && dist <= maxKm) {
      results.push({ name: titleCase(name), lat: coords[0], lng: coords[1], distanceKm: Number(dist.toFixed(2)) });
    }
  }
  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, 15);
}

// Post-process routes with safety scores from the backend
export async function annotateSafetyScores(routes) {
  if (!routes || routes.length === 0) return routes;
  try {
    const allStops = new Set();
    for (const route of routes) {
      const steps = route.steps || [];
      for (const step of steps) {
        if (step.from) allStops.add(step.from);
        if (step.to) allStops.add(step.to);
      }
    }
    if (allStops.size === 0) return routes;

    const { fetchSafetyScore } = await import('./api');
    const scoreData = await fetchSafetyScore([...allStops]);

    for (const route of routes) {
      route.safetyScore = scoreData.safetyScore;
      route.safetyLabel = scoreData.scoreLabel;
      route.safetyIncidents = scoreData.incidentCount;
      route.safetyRisks = scoreData.topRisks;
    }
  } catch (err) {
    console.warn('[safety] Failed to annotate routes:', err.message);
  }
  return routes;
}
