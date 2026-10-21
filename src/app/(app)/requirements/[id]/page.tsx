import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { getRequirementById, getProperties } from "@/lib/data/store";
import { matchPropertiesForRequirement } from "@/lib/matching/engine";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RequirementDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequirementDetailsPage({ params }: RequirementDetailsPageProps) {
  const { id } = await params;
  const requirement = await getRequirementById(id);

  if (!requirement) {
    notFound();
  }

  const { properties } = await getProperties({ limit: 200 });
  const { exactMatches, nearMatches } = matchPropertiesForRequirement(properties, requirement);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/requirements"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                  requirement.purpose === "rent"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                For {requirement.purpose}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                {requirement.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{requirement.title}</h1>
          </div>
        </div>

        <div>
          <Link
            href={`/matches/${requirement.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>View All Matches ({exactMatches.length + nearMatches.length})</span>
          </Link>
        </div>
      </div>

      {/* Criteria Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Requirement Criteria
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Customer</span>
            {requirement.customer ? (
              <Link
                href={`/customers/${requirement.customer.id}`}
                className="font-semibold text-blue-600 hover:underline"
              >
                {requirement.customer.full_name}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">-</span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Budget Cap</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(requirement.max_budget)}
              {requirement.budget_period ? `/${requirement.budget_period}` : ""}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Type / Category</span>
            <span className="font-semibold text-slate-900 capitalize">
              {requirement.property_type || requirement.category}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Furnishing</span>
            <span className="font-semibold text-slate-900 capitalize">
              {requirement.preferred_furnishing?.replace("_", " ") || "Any"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <span className="text-slate-500 block text-[11px] mb-1.5 font-medium">
            Target Locations / Sectors
          </span>
          <div className="flex flex-wrap gap-2">
            {requirement.locations?.map((loc) => (
              <span
                key={loc.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>
                  {loc.sector}, {loc.city}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">(Priority {loc.priority})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Flexibility Summary */}
        <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-600 flex flex-wrap gap-4">
          <span>
            Nearby sectors:{" "}
            <strong>{requirement.allow_nearby_locations ? "Enabled" : "Disabled"}</strong>
          </span>
          <span>
            Alternate property type:{" "}
            <strong>{requirement.allow_alternate_property_types ? "Enabled" : "Disabled"}</strong>
          </span>
          <span>
            Alternate furnishing:{" "}
            <strong>{requirement.allow_alternate_furnishing ? "Enabled" : "Disabled"}</strong>
          </span>
          <span>
            Budget flexibility:{" "}
            <strong>+{requirement.budget_flexibility_percent}%</strong>
          </span>
        </div>
      </div>

      {/* Match Results Summary Banner */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Matching Engine Results</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Identified <strong className="text-blue-700">{exactMatches.length} Exact</strong> matches and{" "}
            <strong className="text-indigo-700">{nearMatches.length} Near</strong> matches in your active inventory.
          </p>
        </div>
        <Link
          href={`/matches/${requirement.id}`}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
        >
          View Full Matching Screen →
        </Link>
      </div>
    </div>
  );
}
