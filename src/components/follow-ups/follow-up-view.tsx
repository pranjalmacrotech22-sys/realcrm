"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Building2,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { FollowUp, Customer, Property, Requirement } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toggleFollowUpStatus, createFollowUp } from "@/lib/data/store";

interface FollowUpViewProps {
  initialFollowUps: FollowUp[];
  customers: Customer[];
  properties: Property[];
  requirements: Requirement[];
  defaultCustomerId?: string;
  defaultRequirementId?: string;
}

export function FollowUpView({
  initialFollowUps,
  customers,
  properties,
  requirements,
  defaultCustomerId,
  defaultRequirementId,
}: FollowUpViewProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [showCreateModal, setShowCreateModal] = useState(
    Boolean(defaultCustomerId || defaultRequirementId)
  );

  // New follow-up fields
  const [customerId, setCustomerId] = useState(defaultCustomerId || customers[0]?.id || "");
  const [requirementId, setRequirementId] = useState(defaultRequirementId || "");
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = followUps.filter((f) => {
    if (statusFilter === "all") return true;
    return f.status === statusFilter;
  });

  async function handleToggleStatus(id: string, current: string) {
    const nextStatus = current === "completed" ? "pending" : "completed";
    try {
      const updated = await toggleFollowUpStatus(id, nextStatus as any);
      if (updated) {
        setFollowUps(followUps.map((f) => (f.id === id ? { ...f, status: nextStatus as any } : f)));
      }
    } catch {
      // Non-blocking
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !title.trim() || !dueDate) return;
    setLoading(true);

    try {
      const created = await createFollowUp({
        organization_id: "",
        customer_id: customerId,
        requirement_id: requirementId || null,
        property_id: propertyId || null,
        title: title.trim(),
        due_at: new Date(dueDate).toISOString(),
        status: "pending",
        notes: notes.trim() || null,
      });

      setFollowUps([
        {
          ...created,
          customer: customers.find((c) => c.id === customerId),
          property: properties.find((p) => p.id === propertyId),
        },
        ...followUps,
      ]);

      setShowCreateModal(false);
      setTitle("");
      setNotes("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <span>Follow-ups & Client Interactions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track site visits, negotiation calls, and customer action items.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {["pending", "completed", "all"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
              statusFilter === tab
                ? "bg-white text-blue-700 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span>No {statusFilter} follow-ups found.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((follow) => {
              const isOverdue =
                follow.status === "pending" && new Date(follow.due_at).getTime() < Date.now();

              return (
                <div
                  key={follow.id}
                  className="p-4 hover:bg-slate-50 transition flex items-start gap-3.5"
                >
                  <button
                    onClick={() => handleToggleStatus(follow.id, follow.status)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition"
                    title={
                      follow.status === "completed" ? "Mark as pending" : "Mark as completed"
                    }
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        follow.status === "completed"
                          ? "text-emerald-600 fill-emerald-50"
                          : "text-slate-300"
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          follow.status === "completed"
                            ? "line-through text-slate-400"
                            : "text-slate-900"
                        }`}
                      >
                        {follow.title}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-200">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {follow.customer && (
                        <Link
                          href={`/customers/${follow.customer.id}`}
                          className="hover:text-blue-600 font-medium text-slate-700 flex items-center gap-1"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{follow.customer.full_name}</span>
                        </Link>
                      )}

                      {follow.property && (
                        <Link
                          href={`/properties/${follow.property.id}`}
                          className="hover:text-blue-600 flex items-center gap-1 text-slate-600"
                        >
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>
                            {follow.property.property_code}: {follow.property.title}
                          </span>
                        </Link>
                      )}

                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Due: {formatDate(follow.due_at)}</span>
                      </span>
                    </div>

                    {follow.notes && (
                      <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                        {follow.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <span>Schedule New Follow-up</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Site Visit at Platinum Heights or Price Negotiation Call"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link to Property (Optional)
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="">None (General Client Follow-up)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.property_code}: {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key with guard, client bringing chequebook..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs disabled:opacity-50"
                >
                  {loading ? "Scheduling..." : "Save Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
