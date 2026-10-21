export default function PropertiesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-6 w-44 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-32 bg-blue-100 rounded-xl" />
        </div>
      </div>

      {/* Filter and search bar skeleton */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="h-9 bg-slate-100 rounded-lg" />
          <div className="h-9 bg-slate-100 rounded-lg" />
          <div className="h-9 bg-slate-100 rounded-lg" />
          <div className="h-9 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Property Cards Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 bg-slate-200 rounded-sm" />
                <div className="h-5 w-16 bg-slate-100 rounded-sm" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-1/2 bg-slate-100 rounded-md" />
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="h-3.5 w-16 bg-slate-100 rounded-md" />
                <div className="h-3.5 w-16 bg-slate-100 rounded-md" />
                <div className="h-3.5 w-16 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="h-6 w-24 bg-slate-200 rounded-md" />
              <div className="h-7 w-20 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
