import { TYPE_LABELS } from '../api';

const MODE_COLORS = {
  bus: 'bg-emerald-100 text-emerald-700',
  metro: 'bg-blue-100 text-blue-700',
  walk: 'bg-slate-100 text-slate-600',
};

const MODE_ICONS = {
  bus: '🚌',
  metro: '🚇',
  walk: '🚶',
};

export default function RouteCard({ route, selected, onClick, index }) {
  if (!route) return null;

  const fare = route.fare ?? route.totalFare ?? route.estimatedFare;
  const duration = route.duration ?? route.estimatedTime;
  const legs = route.legs ?? route.steps ?? [];
  const modes = [...new Set(legs.map((l) => l.mode).filter(Boolean))];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500">Option {index + 1}</span>
        {fare != null && (
          <span className="text-sm font-bold text-emerald-700">৳{fare}</span>
        )}
      </div>

      {modes.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {modes.map((mode) => (
            <span
              key={mode}
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODE_COLORS[mode] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {MODE_ICONS[mode] ?? '🚌'} {mode}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        {duration && <span>⏱ {duration}</span>}
        {legs.length > 0 && (
          <span>{legs.length} step{legs.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {route.summary && (
        <p className="text-xs text-slate-500 mt-1 truncate">{route.summary}</p>
      )}
    </button>
  );
}
