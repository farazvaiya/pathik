const MODE_ICONS = { bus: '🚌', ac_bus: '🚌', metro: '🚇', walk: '🚶' };

const SAFETY_COLORS = {
  safe: { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' },
  moderate: { bg: '#fef3c7', border: '#fde68a', text: '#92400e' },
  caution: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' },
};

export default function RouteCard({ route, selected, onClick, index }) {
  if (!route) return null;

  const steps = route.steps || [];
  const stepsModes = steps.map(s => s.icon || MODE_ICONS[s.mode] || '🚌').join(' → ');
  const cost = route.total_cost_range || `৳${route.total_cost}`;
  const tm = route.total_time_range || `${route.total_time_minutes || '?'} min`;
  const allBusNames = [...new Set(steps.flatMap(s => s.bus_names || []).filter(Boolean))];

  const safetyScore = route.safetyScore;
  const safetyLabel = route.safetyLabel || 'moderate';
  const sc = SAFETY_COLORS[safetyLabel] || SAFETY_COLORS.moderate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`route-card w-full text-left ${selected ? 'active' : ''}`}
    >
      <p className="route-title" style={{ margin: 0, marginBottom: 8, fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>
        {route.label || `Option ${index + 1}`}
      </p>

      <div className="source-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span className="source-pill" style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 26,
          border: route.source === 'community' ? '1px solid #c4b5fd' : '1px solid #bbf7d0',
          background: route.source === 'community' ? '#f5f3ff' : '#f0fdf4',
          color: route.source === 'community' ? '#5b21b6' : '#166534',
          borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
        }}>
          {route.source === 'community' ? '👥 Community' : 'Local DB'}
        </span>
        <span className="source-pill" style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 26,
          border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534',
          borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
        }}>
          Confidence: High
        </span>
        {safetyScore != null && (
          <span className="source-pill" style={{
            display: 'inline-flex', alignItems: 'center', minHeight: 26,
            border: `1px solid ${sc.border}`, background: sc.bg, color: sc.text,
            borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
          }}>
            🛡️ Safety: {safetyScore}/10
          </span>
        )}
      </div>

      <div className="route-meta" style={{ display: 'flex', gap: 14, fontSize: '0.9rem', color: '#374151', marginBottom: 4 }}>
        <span>💰 {cost}</span>
        <span>⏱ {tm}</span>
      </div>

      <div style={{ marginTop: 8, fontSize: '1.05rem', color: '#374151' }}>
        {stepsModes}
      </div>

      {allBusNames.length > 0 && (
        <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#166534', fontWeight: 600 }}>
          🚌 {allBusNames.join(', ')}
        </div>
      )}
    </button>
  );
}
