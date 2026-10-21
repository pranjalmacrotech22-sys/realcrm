"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Sparkles,
  MapPin,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Requirement } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RequirementListViewProps {
  initialRequirements: Requirement[];
}

export function RequirementListView({ initialRequirements }: RequirementListViewProps) {
  const router = useRouter();
  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirements);
  const [searchQuery, setSearchQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  useEffect(() => {
    setRequirements(initialRequirements);
  }, [initialRequirements]);

  useEffect(() => {
    const handler = () => router.refresh();
    window.addEventListener("realcrm:refresh", handler);
    return () => window.removeEventListener("realcrm:refresh", handler);
  }, [router]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (purposeFilter !== "all" && req.purpose !== purposeFilter) return false;
      if (statusFilter !== "all" && req.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          req.title.toLowerCase().includes(q) ||
          (req.customer?.full_name && req.customer.full_name.toLowerCase().includes(q)) ||
          (req.locations && req.locations.some((l) => l.sector.toLowerCase().includes(q))) ||
          (req.category && req.category.toLowerCase().includes(q)) ||
          (req.property_type && req.property_type.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [requirements, searchQuery, purposeFilter, statusFilter]);

  const activeCount = requirements.filter((r) => r.status === "active").length;
  const rentCount = requirements.filter((r) => r.purpose === "rent" && r.status === "active").length;
  const buyCount = requirements.filter((r) => r.purpose === "sale" && r.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Customer Requirements & Demands</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client requirement criteria ready for deterministic rule-based matching against internal inventory.
          </p>
        </div>
        <div>
          <Link
            href="/requirements/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Requirement</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Demands
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activeCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">profiles</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Rental Searches
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-blue-600 tracking-tight">
              {rentCount}
            </span>
            <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-sm border border-blue-100 font-medium">
              Tenants
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Purchase Enquiries
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 tracking-tight">
              {buyCount}
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-100 font-medium">
              Buyers
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Matching Accuracy
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-indigo-600 tracking-tight">
              100%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">deterministic</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, target sector, or requirement title..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
          />
        </div>

        {/* Purpose Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: "all", label: "All Demands" },
            { id: "rent", label: "Rent" },
            { id: "sale", label: "Buy / Resale" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPurposeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                purposeFilter === tab.id
                  ? "bg-white text-blue-700 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Results */}
      {filteredRequirements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No requirements found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? "No requirements match your current search criteria. Try a broader search."
              : "No customer requirements logged in this workspace yet. Record your first client requirement to start matching."}
          </p>
          <div className="flex items-center justify-center gap-2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Clear Search
              </button>
            ) : null}
            <Link
              href="/requirements/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Client Requirement</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Requirement Details</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Purpose / Specs</th>
                  <th className="py-3.5 px-4">Budget Cap</th>
                  <th className="py-3.5 px-4">Target Sectors</th>
                  <th className="py-3.5 px-4">Flexibility</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Matching Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequirements.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link
                        href={`/requirements/${req.id}`}
                        className="hover:text-blue-600 font-bold block text-sm leading-tight"
                      >
                        {req.title}
                      </Link>
                      <span className="text-[11px] text-slate-500 block font-normal mt-0.5">
                        {req.category} {req.property_type ? `• ${req.property_type}` : ""}
                        {req.preferred_furnishing
                          ? ` • ${req.preferred_furnishing.replace("_", " ")}`
                          : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {req.customer ? (
                        <Link
                          href={`/customers/${req.customer.id}`}
                          className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{req.customer.full_name}</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          req.purpose === "rent"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {req.purpose}
                      </span>
                      {req.min_bhk && (
                        <span className="ml-1.5 text-xs font-semibold text-slate-800">
                          {req.min_bhk} BHK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                      {formatCurrency(req.max_budget)}
                      {req.budget_period && `/${req.budget_period}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px] font-medium">
                          {req.locations && req.locations.length > 0
                            ? req.locations.map((l) => l.sector).join(", ")
                            : "Any Sector"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      {req.budget_flexibility_percent > 0 ? (
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          +{req.budget_flexibility_percent}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Strict</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/matches/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Find Matches</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
