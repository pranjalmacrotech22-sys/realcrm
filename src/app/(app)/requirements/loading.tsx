export default function RequirementsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-36 bg-blue-100 rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex gap-3">
        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
        <div className="h-9 w-32 bg-slate-100 rounded-lg" />
      </div>

      {/* Requirements cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 bg-slate-200 rounded-sm" />
                <div className="h-5 w-20 bg-blue-100 rounded-full" />
              </div>
              <div className="h-4 w-52 bg-slate-200 rounded-md" />
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-20 bg-slate-100 rounded-md" />
                <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
                <div className="h-3.5 w-28 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 bg-slate-100 rounded-lg" />
              <div className="h-9 w-28 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
