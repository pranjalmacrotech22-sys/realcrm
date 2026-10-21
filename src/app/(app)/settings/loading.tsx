export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-pulse">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 space-y-1.5">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-3.5 w-72 bg-slate-100 rounded-md" />
      </div>

      {/* Profile Card Skeleton */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="h-4 w-36 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-slate-200 rounded-md" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-slate-200 rounded-md" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-32 bg-slate-200 rounded-md" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-slate-200 rounded-md" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Security Status Skeleton */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="h-4 w-44 bg-slate-200 rounded-md" />
        <div className="h-14 w-full bg-emerald-50 rounded-lg border border-emerald-100" />
      </div>
    </div>
  );
}
