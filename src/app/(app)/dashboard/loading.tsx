export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Enterprise Welcome Banner skeleton */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="h-5 w-40 bg-slate-800 rounded-md" />
          <div className="h-7 w-64 bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-800 rounded-md" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-9 w-28 bg-blue-600/40 rounded-xl" />
          <div className="h-9 w-36 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-200 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-8 w-20 bg-slate-200 rounded-lg" />
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Micro-Markets row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="h-4 w-44 bg-slate-200 rounded-md" />
          <div className="space-y-3">
            <div className="h-6 w-full bg-slate-100 rounded-lg" />
            <div className="h-6 w-full bg-slate-100 rounded-lg" />
            <div className="h-6 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-56 bg-slate-200 rounded-md" />
            <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-slate-50 border border-slate-200/80 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
