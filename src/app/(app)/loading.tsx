export default function AppLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9 w-32 bg-blue-100 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            <div className="h-3 w-36 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Table / List Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-9 w-64 bg-slate-100 rounded-xl" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-slate-100 rounded-xl" />
            <div className="h-9 w-24 bg-slate-100 rounded-xl" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 rounded-md" />
                  <div className="h-3 w-24 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-6">
                <div className="h-4 w-24 bg-slate-200 rounded-md" />
                <div className="h-4 w-20 bg-slate-100 rounded-md" />
                <div className="h-8 w-16 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
