"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  Mail,
  FileText,
  CalendarCheck,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Building,
  UserCheck,
} from "lucide-react";
import { Customer } from "@/types";
import { formatDate } from "@/lib/utils";

interface CustomerListViewProps {
  initialCustomers: Customer[];
}

export function CustomerListView({ initialCustomers }: CustomerListViewProps) {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== "all" && c.customer_type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          c.full_name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q)) ||
          (c.source && c.source.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [customers, searchQuery, typeFilter]);

  const buyersCount = customers.filter((c) => c.customer_type === "buyer").length;
  const tenantsCount = customers.filter((c) => c.customer_type === "tenant").length;
  const investorsCount = customers.filter((c) => c.customer_type === "investor").length;

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Customer & Client Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your buyers, tenants, and investors, their active requirements, and scheduled follow-ups.
          </p>
        </div>
        <div>
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Directory
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {customers.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">clients</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Buyers
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 tracking-tight">
              {buyersCount}
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-100 font-medium">
              Purchase
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Prospective Tenants
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-blue-600 tracking-tight">
              {tenantsCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">rental</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Commercial / Investors
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-purple-600 tracking-tight">
              {investorsCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">high net worth</span>
          </div>
        </div>
      </div>

      {/* Search & Segment Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, phone number, email, or notes..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: "all", label: "All Clients" },
            { id: "buyer", label: "Buyers" },
            { id: "tenant", label: "Tenants" },
            { id: "investor", label: "Investors" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === tab.id
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
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No customers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? "No clients match your search query. Try clearing your search term."
              : "You haven't added any clients to your private directory yet."}
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
              href="/customers/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Customer</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Client Name & Notes</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Client Type</th>
                  <th className="py-3.5 px-4">Requirements</th>
                  <th className="py-3.5 px-4">Follow-ups</th>
                  <th className="py-3.5 px-4">Acquisition Source</th>
                  <th className="py-3.5 px-4">Added Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/customers/${cust.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 block text-sm leading-tight"
                      >
                        {cust.full_name}
                      </Link>
                      {cust.notes && (
                        <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                          {cust.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                        <a
                          href={`tel:${cust.phone}`}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </a>
                        {cust.email && (
                          <span className="text-slate-500 flex items-center gap-1 font-sans text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{cust.email}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          cust.customer_type === "tenant"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : cust.customer_type === "buyer"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {cust.customer_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{cust.requirements_count || 0} active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>{cust.follow_ups_count || 0} pending</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-700 font-medium">
                      {cust.source?.replace("_", " ") || "Direct"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                      {formatDate(cust.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/requirements/new?customerId=${cust.id}`}
                          title="Add New Requirement for Client"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/follow-ups?newForCustomerId=${cust.id}`}
                          title="Schedule Follow-up Call or Showing"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/customers/${cust.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200 transition"
                        >
                          Profile →
                        </Link>
                      </div>
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
