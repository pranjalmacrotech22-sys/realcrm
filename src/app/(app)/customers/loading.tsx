export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-6 w-40 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-60 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-blue-100 rounded-xl" />
      </div>

      {/* Search & filter skeleton */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="h-9 w-full sm:w-72 bg-slate-100 rounded-lg" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-9 w-24 bg-slate-100 rounded-lg" />
          <div className="h-9 w-24 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Customer rows list skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-slate-200 rounded-md" />
                <div className="h-3 w-48 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="h-4 w-28 bg-slate-100 rounded-md" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
              <div className="h-8 w-16 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
