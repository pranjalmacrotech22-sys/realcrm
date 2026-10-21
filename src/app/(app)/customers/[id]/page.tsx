import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  Plus,
  FileText,
  CalendarCheck,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  getCustomerById,
  getRequirements,
  getFollowUps,
  getActivities,
} from "@/lib/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const requirements = await getRequirements(customer.id);
  const followUps = await getFollowUps(undefined, customer.id);
  const activities = await getActivities({ customerId: customer.id });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.full_name}</h1>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                  customer.customer_type === "tenant"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : customer.customer_type === "buyer"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-purple-50 text-purple-700 border border-purple-200"
                }`}
              >
                {customer.customer_type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client profile added on {formatDate(customer.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/requirements/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Requirement</span>
          </Link>
          <Link
            href={`/follow-ups?newForCustomerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Schedule Follow-up</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Requirements & Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Requirements List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Customer Requirements ({requirements.length})</span>
              </h2>
              <Link
                href={`/requirements/new?customerId=${customer.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </Link>
            </div>

            {requirements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>No active requirements logged for this customer.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requirements.map((req) => (
                  <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                              req.purpose === "rent"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            For {req.purpose}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{req.title}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Budget:{" "}
                            <strong className="text-slate-800">
                              {formatCurrency(req.max_budget)}
                              {req.budget_period ? `/${req.budget_period}` : ""}
                            </strong>
                          </span>
                          {req.min_bhk && <span>• {req.min_bhk} BHK</span>}
                          {req.locations && req.locations.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {req.locations.map((l) => l.sector).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Smart Match CTA */}
                      <Link
                        href={`/matches/${req.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Find Matches</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Follow-ups */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-600" />
                <span>Scheduled Follow-ups & Visits</span>
              </h2>
              <Link
                href="/follow-ups"
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                All Follow-ups
              </Link>
            </div>

            {followUps.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No upcoming follow-ups scheduled with this customer.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {followUps.map((follow) => (
                  <div key={follow.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              follow.status === "completed"
                                ? "bg-emerald-500"
                                : follow.status === "cancelled"
                                ? "bg-slate-400"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="text-xs font-semibold text-slate-900">
                            {follow.title}
                          </span>
                        </div>
                        {follow.notes && (
                          <p className="text-xs text-slate-600 mt-1">{follow.notes}</p>
                        )}
                        {follow.property && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>
                              {follow.property.property_code}: {follow.property.title}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                          {formatDate(follow.due_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Contact Profile & Timeline */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Contact Information
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Primary Phone</span>
                <a
                  href={`tel:${customer.phone}`}
                  className="font-mono font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{customer.phone}</span>
                </a>
              </div>

              {customer.alternate_phone && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Alternate Phone</span>
                  <a
                    href={`tel:${customer.alternate_phone}`}
                    className="font-mono font-medium text-slate-700 flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{customer.alternate_phone}</span>
                  </a>
                </div>
              )}

              {customer.email && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Email Address</span>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-slate-800 hover:underline flex items-center gap-1 mt-0.5 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </a>
                </div>
              )}

              {customer.source && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Acquisition Source</span>
                  <span className="capitalize text-slate-800">
                    {customer.source.replace("_", " ")}
                  </span>
                </div>
              )}

              {customer.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[11px] mb-1">Profile Notes</span>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    &ldquo;{customer.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Activity Timeline</span>
            </h2>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500">No activities recorded yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="text-xs border-l-2 border-blue-600 pl-3 py-0.5">
                    <p className="text-slate-800 font-medium">{act.description}</p>
                    <span className="text-[10px] text-slate-400">{formatDate(act.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
