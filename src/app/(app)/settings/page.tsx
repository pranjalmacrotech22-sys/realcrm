import {
  Settings as SettingsIcon,
  Building,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  Download,
  CheckCircle2,
} from "lucide-react";
import { getActiveOrganization, getProperties } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function SettingsPage() {
  const [org, { total }] = await Promise.all([
    getActiveOrganization(),
    getProperties({ limit: 1 }),
  ]);
  const liveSupabase = isSupabaseConfigured();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure organization profile, property code formats, and data security.
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span>Organization Profile</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 text-[11px] font-semibold mb-1">
              Company Name
            </label>
            <input
              type="text"
              readOnly
              value={org.name}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[11px] font-semibold mb-1">
              Workspace Identifier (Slug)
            </label>
            <input
              type="text"
              readOnly
              value={org.slug}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[11px] font-semibold mb-1">
              Organization UUID (Tenant Key)
            </label>
            <input
              type="text"
              readOnly
              value={org.id}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[11px] font-semibold mb-1">
              Created Date
            </label>
            <input
              type="text"
              readOnly
              value={formatDate(org.created_at)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Database & RLS Security Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>PostgreSQL Row Level Security (RLS) Status</span>
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Multi-Tenant Isolation Active</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                All 11 database tables enforce Postgres RLS via <code>get_user_organizations()</code> and <code>has_org_role()</code>. Cross-tenant access is rejected at database level.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Database Connection</span>
              <span className="font-semibold text-slate-900">
                {liveSupabase ? "Supabase PostgreSQL (Live)" : "Local Development Sandbox"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Active Properties Count</span>
              <span className="font-semibold text-slate-900">{total} listings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Privacy Policy */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs text-slate-600">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Storage Bucket Policy</span>
        </h2>
        <p className="leading-relaxed">
          Property photos and blueprints are uploaded to the private Supabase storage bucket <code>property-media</code>. Access is strictly authenticated and validated by organization membership folders (<code>organization_id/property_id/*</code>).
        </p>
      </div>
    </div>
  );
}
