import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowUpRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Home,
  Building,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getDashboardMetrics } from "@/lib/data/store";
import { getSession } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  const metrics = await getDashboardMetrics();
  const orgName = session?.organizationName || "My Real Estate Workspace";

  return (
    <div className="space-y-6">
      {/* Enterprise Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,#2563eb_0%,transparent_70%)] opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-[11px] font-semibold text-blue-300 mb-3">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Tenant Portfolio Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {orgName} Portfolio Overview
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Track your private inventory across sectors, monitor active customer requirements, and match listings with structured rule-based precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/properties/new"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm shadow-blue-500/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </Link>
            <Link
              href="/requirements/new"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition backdrop-blur-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Match Requirement</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inventory
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.totalProperties}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {metrics.availableProperties} Active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Rent: <strong className="text-slate-800">{metrics.rentalProperties}</strong></span>
            <span>Sale: <strong className="text-slate-800">{metrics.saleProperties}</strong></span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Client Network
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.activeCustomers}
            </span>
            <span className="text-xs text-slate-500 font-medium">Verified Profiles</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Buyers & Tenants</span>
            <Link href="/customers" prefetch={true} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              <span>Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Requirements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Demands
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.activeRequirements}
            </span>
            <span className="text-xs font-semibold text-indigo-600 flex items-center bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              <Sparkles className="w-3 h-3 mr-1" />
              Engine Ready
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Instant Matching</span>
            <Link href="/requirements" prefetch={true} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              <span>View list</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Action Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.pendingFollowUps}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Scheduled
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Site Visits & Calls</span>
            <Link href="/follow-ups" prefetch={true} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              <span>Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Row: Inventory Composition & Sector Micro-markets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Composition */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Asset Category Breakdown</span>
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Home className="w-3.5 h-3.5 text-blue-600" />
                  Residential (Flats, Floors, Villas)
                </span>
                <span className="font-bold text-slate-900">{metrics.residentialProperties}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalProperties ? (metrics.residentialProperties / metrics.totalProperties) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  Commercial (Shops, Offices)
                </span>
                <span className="font-bold text-slate-900">{metrics.commercialProperties}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalProperties ? (metrics.commercialProperties / metrics.totalProperties) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Land & Plots
                </span>
                <span className="font-bold text-slate-900">{metrics.landProperties}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.totalProperties ? (metrics.landProperties / metrics.totalProperties) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Micro-markets by Sector */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Micro-Market Distribution by Sector</span>
            </h2>
            <Link href="/properties" prefetch={true} className="text-xs text-blue-600 font-semibold hover:underline">
              Filter inventory →
            </Link>
          </div>
          {metrics.sectorBreakdown.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-600">No micro-market data yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Location analytics will appear here once properties are added to your inventory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.sectorBreakdown.map((item) => (
                <div
                  key={item.sector}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {item.sector}
                  </span>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900">{item.count}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Listings
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dual Section: Recently Added Properties & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Properties */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Recently Catalogued Properties</span>
            </h2>
            <Link
              href="/properties"
              prefetch={true}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.recentProperties.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-2">
                  <Building2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800">No properties catalogued yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto mb-3">
                  Start tracking residential flats, floors, villas, plots, and commercial units in your workspace.
                </p>
                <Link
                  href="/properties/new"
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Property</span>
                </Link>
              </div>
            ) : (
              metrics.recentProperties.map((prop) => (
                <div key={prop.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-sm bg-slate-900 text-white">
                          {prop.property_code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                            prop.purpose === "rent"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          For {prop.purpose}
                        </span>
                      </div>
                      <Link
                        href={`/properties/${prop.id}`}
                        prefetch={true}
                        className="block text-sm font-semibold text-slate-900 mt-1 hover:text-blue-600 truncate"
                      >
                        {prop.title}
                      </Link>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {prop.sector}, {prop.city}
                        </span>
                        {prop.bhk && <span>• {prop.bhk} BHK</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(prop.price_amount)}
                      </span>
                      {prop.rent_period && (
                        <span className="text-[10px] text-slate-500 block font-normal">
                          /{prop.rent_period}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Client Follow-ups */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              <span>Upcoming Client Interactions</span>
            </h2>
            <Link
              href="/follow-ups"
              prefetch={true}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.upcomingFollowUps.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No pending follow-ups scheduled today.
              </div>
            ) : (
              metrics.upcomingFollowUps.map((follow) => (
                <div key={follow.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {follow.title}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client:{" "}
                        <span className="font-semibold text-slate-800">
                          {follow.customer?.full_name || "Client"}
                        </span>{" "}
                        ({follow.customer?.phone})
                      </p>
                      {follow.notes && (
                        <p className="text-xs text-slate-600 italic mt-1 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                          &ldquo;{follow.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDate(follow.due_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
