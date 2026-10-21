export default function FollowUpsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-6 w-44 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-60 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-36 bg-amber-100 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
        <div className="h-9 w-24 bg-slate-100 rounded-lg" />
        <div className="h-9 w-24 bg-slate-100 rounded-lg" />
      </div>

      {/* Task list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 rounded-md" />
                <div className="h-3 w-56 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
