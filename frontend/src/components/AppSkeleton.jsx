function SkeletonBlock({ className }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex justify-between">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-10" />
      </div>
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

export default function AppSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2 mb-4">
        <SkeletonBlock className="h-10 flex-1" />
        <SkeletonBlock className="h-10 flex-1" />
        <SkeletonBlock className="h-10 w-20" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBlock className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
