const fs = require('fs');

/**
 * Scan text and return ONLY the first top-level JSON object/array.
 * Ignores everything after it (chat text, HTML, duplicate blocks, etc.).
 */
function extractFirstJSON(text) {
  let depth = 0, inString = false, escape = false, start = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{' || c === '[') { if (depth === 0) start = i; depth++; }
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try { JSON.parse(candidate); return candidate; } catch (_) {}
      }
    }
  }
  throw new Error('No valid JSON object/array found in file');
}

const inputFile = fs.existsSync('route.txt') ? 'route.txt' : 'routes.txt';
console.log(`[Pathik] Reading ${inputFile}...`);

if (!fs.existsSync(inputFile)) {
  console.error(`[Pathik] ❌ ${inputFile} not found`);
  process.exit(1);
}

let raw = fs.readFileSync(inputFile, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) { raw = raw.slice(1); console.log('[Pathik] Stripped UTF-8 BOM'); }

let jsonText;
try {
  jsonText = extractFirstJSON(raw);
  console.log('[Pathik] Extracted clean JSON block');
} catch (e) {
  console.error(`[Pathik] ❌ ${e.message}`);
  process.exit(1);
}

jsonText = jsonText.replace(/,(?=\s*[}\]])/g, '');

let data;
try { data = JSON.parse(jsonText); }
catch (e) {
  console.error('[Pathik] ❌ JSON parse failed after cleanup:', e.message);
  process.exit(1);
}

const buses = data.dhaka_local_buses || data.buses || data.routes || [];
if (!Array.isArray(buses) || buses.length === 0) {
  console.error('[Pathik] ❌ No bus array found. Keys:', Object.keys(data).join(', '));
  process.exit(1);
}
console.log(`[Pathik] Found ${buses.length} buses`);

const places = {};
const corridors = [];
const toKey = (s) => String(s).toLowerCase().trim();

buses.forEach((bus) => {
  const flow = Array.isArray(bus.route_flow) ? bus.route_flow : [];
  if (flow.length < 2) return;
  const stops = flow.map((s) => String(s).trim()).filter(Boolean);
  if (stops.length < 2) return;

  const name = String(bus.bus_name || 'Unknown').split('(')[0].trim();
  const isAC = /\(AC\)|AC Bus/i.test(bus.bus_name || '') || /ac/i.test(String(bus.service_type || ''));

  stops.forEach((s) => { const k = toKey(s); if (!places[k]) places[k] = []; });

  corridors.push({
    from: toKey(stops[0]),
    to: toKey(stops[stops.length - 1]),
    direct: { mode: isAC ? 'ac_bus' : 'bus', names: [name], stops },
  });
});

fs.writeFileSync(
  'routes.json',
  JSON.stringify(
    {
      _note: `Auto-converted from ${inputFile}. ${corridors.length} corridors.`,
      places,
      corridors,
    },
    null,
    2
  )
);

console.log(`[Pathik] ✅ routes.json written: ${corridors.length} corridors, ${Object.keys(places).length} stops`);
console.log(`[Pathik] Verify: open routes.json and search for "Ashulia Classic" — you should see "names": ["Ashulia Classic"]`);
