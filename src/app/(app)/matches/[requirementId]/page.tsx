import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarCheck,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { getRequirementById, getProperties } from "@/lib/data/store";
import { matchPropertiesForRequirement } from "@/lib/matching/engine";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MatchesPageProps {
  params: Promise<{ requirementId: string }>;
}

export default async function MatchesPage({ params }: MatchesPageProps) {
  const { requirementId } = await params;
  const requirement = await getRequirementById(requirementId);

  if (!requirement) {
    notFound();
  }

  const { properties } = await getProperties({ limit: 200 });
  const { exactMatches, nearMatches } = matchPropertiesForRequirement(properties, requirement);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={`/requirements/${requirement.id}`}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                Deterministic Smart Match
              </span>
              <span className="text-xs text-slate-500">
                Client:{" "}
                <Link
                  href={`/customers/${requirement.customer_id}`}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  {requirement.customer?.full_name}
                </Link>
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">
              Property Matches for: {requirement.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/follow-ups?newForCustomerId=${requirement.customer_id}&newForRequirementId=${requirement.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Schedule Follow-up</span>
          </Link>
        </div>
      </div>

      {/* Requirement Summary Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Purpose</span>
              <span className="font-semibold text-slate-900 capitalize">
                {requirement.purpose} ({requirement.property_type || requirement.category})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Budget Cap</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(requirement.max_budget)}
                {requirement.budget_period && `/${requirement.budget_period}`}
              </span>
            </div>
            {requirement.min_bhk && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">BHK</span>
                <span className="font-semibold text-slate-900">{requirement.min_bhk} BHK</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Furnishing</span>
              <span className="font-semibold text-slate-900 capitalize">
                {requirement.preferred_furnishing?.replace("_", " ") || "Any"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Sectors</span>
              <span className="font-semibold text-slate-900">
                {requirement.locations?.map((l) => l.sector).join(", ") || "Any"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {exactMatches.length} Exact
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              {nearMatches.length} Near
            </span>
          </div>
        </div>
      </div>

      {/* SECTION A: EXACT MATCHES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Exact Matches ({exactMatches.length})</span>
          </h2>
          <span className="text-xs text-slate-500">
            Satisfies 100% of hard constraints & primary criteria
          </span>
        </div>

        {exactMatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No exact matches found in your current available inventory. See near matches below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exactMatches.map(({ property, score }) => (
              <div
                key={property.id}
                className="bg-white rounded-xl border-2 border-emerald-500/40 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-white">
                        {property.property_code}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Exact Match
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{score}% Match</span>
                    </div>
                  </div>

                  <Link
                    href={`/properties/${property.id}`}
                    className="block text-sm font-bold text-slate-900 hover:text-blue-600 transition truncate"
                  >
                    {property.title}
                  </Link>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {property.society_name ? `${property.society_name}, ` : ""}
                      {property.sector}, {property.city}
                    </span>
                  </p>

                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(property.price_amount)}
                      {property.rent_period && (
                        <span className="text-xs font-normal text-slate-500">
                          /{property.rent_period}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      {property.bhk ? `${property.bhk} BHK • ` : ""}
                      {property.furnishing_status?.replace("_", " ") || "Unfurnished"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Owner: <strong className="text-slate-800">{property.owner_name}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View Property →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION B: NEAR MATCHES */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Near Matches ({nearMatches.length})</span>
          </h2>
          <span className="text-xs text-slate-500">
            Permitted via enabled flexibility options with structured variance tags
          </span>
        </div>

        {nearMatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No near matches found. Consider increasing budget flexibility or enabling nearby locations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearMatches.map(({ property, score, mismatchReasons }) => (
              <div
                key={property.id}
                className="bg-white rounded-xl border border-indigo-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-white">
                        {property.property_code}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Near Match
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                      <span>{score}% Fit</span>
                    </div>
                  </div>

                  <Link
                    href={`/properties/${property.id}`}
                    className="block text-sm font-bold text-slate-900 hover:text-blue-600 transition truncate"
                  >
                    {property.title}
                  </Link>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {property.society_name ? `${property.society_name}, ` : ""}
                      {property.sector}, {property.city}
                    </span>
                  </p>

                  {/* Structured Mismatch Reasons Display */}
                  <div className="mt-3 space-y-1.5">
                    {mismatchReasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-md bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{reason.label}</span>
                        </span>
                        {reason.difference && (
                          <span className="font-mono font-semibold text-amber-800">
                            {reason.difference}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(property.price_amount)}
                      {property.rent_period && (
                        <span className="text-xs font-normal text-slate-500">
                          /{property.rent_period}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      {property.bhk ? `${property.bhk} BHK • ` : ""}
                      {property.furnishing_status?.replace("_", " ") || "Unfurnished"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Owner: <strong className="text-slate-800">{property.owner_name}</strong>
                  </span>
                  <Link
                    href={`/properties/${property.id}`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View Property →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
