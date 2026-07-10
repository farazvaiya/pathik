const MODE_ICONS = { bus: '🚌', ac_bus: '🚌', metro: '🚇', walk: '🚶' };

const SAFETY_STYLES = {
  safe: { bg: '#dcfce7', border: '#bbf7d0', text: '#166534', icon: '✅' },
  moderate: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', icon: '⚠️' },
  caution: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: '🚨' },
};

export default function RouteDetails({ route, origin, destination }) {
  if (!route) {
    return <div className="route-details empty" style={{ color: '#6b7280', textAlign: 'center', padding: '32px 0' }}>Search to view route steps.</div>;
  }

  const steps = route.steps || [];
  const costStr = route.total_cost_range || `৳${route.total_cost}`;
  const tmStr = route.total_time_range || `${route.total_time_minutes || '?'} মিনিট`;

  const safetyScore = route.safetyScore;
  const safetyLabel = route.safetyLabel || 'moderate';
  const sc = SAFETY_STYLES[safetyLabel] || SAFETY_STYLES.moderate;

  return (
    <div className="route-details">
      {/* Source pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 26,
          border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534',
          borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
        }}>Local DB</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 26,
          border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534',
          borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
        }}>Confidence: High</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 26,
          border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534',
          borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
        }}>Fare logic: BRTA/DMTCL</span>
        {safetyScore != null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', minHeight: 26,
            border: `1px solid ${sc.border}`, background: sc.bg, color: sc.text,
            borderRadius: 999, padding: '4px 9px', fontSize: '0.78rem', fontWeight: 700
          }}>{sc.icon} Safety: {safetyScore}/10</span>
        )}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 12, fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>
        {origin || route.origin || ''} → {destination || route.destination || ''} | মোট খরচ: {costStr} | সময়: {tmStr}
      </div>

      {/* Safety Breakdown */}
      {safetyScore != null && route.safetyRisks && route.safetyRisks.length > 0 && (
        <div style={{
          background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10,
          padding: '8px 12px', marginBottom: 12, fontSize: '0.86rem', color: sc.text
        }}>
          <b>{sc.icon} Route Safety Report ({route.safetyIncidents || 0} recent incidents)</b>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
            {route.safetyRisks.map((risk, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      <ul className="steps" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {steps.map((step, idx) => {
          const icon = step.icon || MODE_ICONS[step.mode] || '🚌';
          const cost = step.cost_range || `৳${step.cost}`;
          const tm = step.time_range || `${step.time_minutes || '?'} মিনিট`;
          const busNames = step.bus_names || [];
          const landmarks = step.landmarks || [];

          return (
            <li key={idx} className="step" style={{
              border: '1px solid #e5e7eb', borderRadius: 12, padding: 10,
              fontSize: '0.92rem', background: '#fcfffd'
            }}>
              <div className="step-top" style={{ fontWeight: 600, marginBottom: 4 }}>
                {icon} ধাপ {idx + 1}: {step.from} → {step.to}
              </div>
              <div className="step-sub" style={{ color: '#6b7280', fontSize: '0.86rem' }}>
                {step.mode?.toUpperCase()} • ভাড়া: {cost} • সময়: {tm}
              </div>

              {busNames.length > 0 && (
                <div className="step-sub" style={{ marginTop: 4 }}>
                  <b>বাস:</b>{' '}
                  {busNames.map(b => (
                    <span key={b} style={{
                      display: 'inline-block', background: '#ecfdf3', color: '#166534',
                      border: '1px solid #bbf7d0', padding: '2px 8px',
                      borderRadius: 999, fontSize: '0.78rem', margin: '2px 4px 2px 0'
                    }}>{b}</span>
                  ))}
                </div>
              )}

              {landmarks.length > 0 && (
                <div className="step-sub" style={{ marginTop: 4, color: '#6b7280', fontSize: '0.86rem' }}>
                  <b>Route:</b> {landmarks.join(' → ')}
                </div>
              )}

              {step.fare_source === 'distance_calc' && step.distance_km && (
                <div className="step-sub" style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.8, color: '#6b7280', fontSize: '0.82rem' }}>
                  📏 {step.distance_km} km • BRTA 2025 rate
                </div>
              )}

              {step.fare_source === 'dmtcl_fare_matrix' && (
                <div className="step-sub" style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.8, color: '#6b7280', fontSize: '0.82rem' }}>
                  🚇 DMTCL MRT-6 official fare
                </div>
              )}

              {step.tip_bn && (
                <div className="step-sub" style={{ marginTop: 6, color: '#6b7280', fontSize: '0.82rem' }}>
                  <b>Tip:</b> {step.tip_bn}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
