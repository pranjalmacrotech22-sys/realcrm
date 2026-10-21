export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="h-6 w-44 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-blue-100 rounded-xl" />
      </div>

      {/* Team Member Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-slate-200 rounded-md" />
                <div className="h-3 w-48 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
              <div className="h-8 w-24 bg-slate-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
