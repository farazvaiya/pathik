import { useState } from 'react';

export default function RouteRating({ routeId, initialRating }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-600">Safety Rating:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star === rating ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-lg transition hover:scale-110"
          >
            {star <= (hovered || rating) ? '★' : '☆'}
          </button>
        ))}
      </div>
      {rating > 0 && (
        <span className="text-xs text-slate-500">{rating}/5</span>
      )}
    </div>
  );
}
