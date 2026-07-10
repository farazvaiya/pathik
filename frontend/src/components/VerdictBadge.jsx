export default function VerdictBadge({ post }) {
  const agree = post?.upvotes ?? 0;
  const disagree = post?.downvotes ?? 0;
  const total = agree + disagree;

  let verdict = 'neutral';
  let label = '◐ New';
  let color = 'bg-slate-100 text-slate-500';

  if (total >= 2) {
    const ratio = agree / total;
    if (ratio >= 0.7) {
      verdict = 'verified';
      label = '✅ Verified';
      color = 'bg-emerald-100 text-emerald-700';
    } else if (disagree / total >= 0.6) {
      verdict = 'disputed';
      label = '⚠️ Disputed';
      color = 'bg-red-100 text-red-700';
    }
  }

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}
