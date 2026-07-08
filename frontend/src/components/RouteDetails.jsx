const MODE_ICONS = {
  bus: '🚌',
  metro: '🚇',
  walk: '🚶',
};

const MODE_COLORS = {
  bus: 'border-emerald-300 bg-emerald-50',
  metro: 'border-blue-300 bg-blue-50',
  walk: 'border-slate-200 bg-slate-50',
};

function StepRow({ step, isLast }) {
  const icon = MODE_ICONS[step.mode] ?? '🚌';
  const color = MODE_COLORS[step.mode] ?? 'border-slate-200 bg-slate-50';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${color}`}>
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {step.instruction ?? step.description ?? `${step.mode} leg`}
        </p>
        <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
          {step.from && <span>From: {step.from}</span>}
          {step.to && <span>→ {step.to}</span>}
        </div>
        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
          {step.duration && <span>⏱ {step.duration}</span>}
          {step.fare != null && <span>৳{step.fare}</span>}
          {step.busName && <span>🚌 {step.busName}</span>}
          {step.line && <span>Line: {step.line}</span>}
        </div>
      </div>
    </div>
  );
}

export default function RouteDetails({ route }) {
  if (!route) {
    return (
      <div className="text-center text-sm text-slate-400 py-8">
        Select a route to see details 🗺️
      </div>
    );
  }

  const legs = route.legs ?? route.steps ?? [];
  const fare = route.fare ?? route.totalFare ?? route.estimatedFare;
  const duration = route.duration ?? route.estimatedTime;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700">Route Details</h3>
        <div className="flex gap-3 text-xs text-slate-500">
          {duration && <span>⏱ {duration}</span>}
          {fare != null && <span className="font-bold text-emerald-700">৳{fare}</span>}
        </div>
      </div>

      {route.from && route.to && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-3">
          📍 {route.from} → {route.to}
        </div>
      )}

      {legs.length > 0 ? (
        <div>
          {legs.map((step, i) => (
            <StepRow key={i} step={step} isLast={i === legs.length - 1} />
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 text-center py-4">
          No step-by-step breakdown available.
        </div>
      )}

      {route.aiExplanation && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          🤖 {route.aiExplanation}
        </div>
      )}
    </div>
  );
}
