"use client";

import { useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  User,
  Lock,
} from "lucide-react";
import { Membership, UserRole } from "@/types";
import { updateMemberRole } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";

interface TeamManagementViewProps {
  initialMembers: Membership[];
}

export function TeamManagementView({ initialMembers }: TeamManagementViewProps) {
  const [members, setMembers] = useState<Membership[]>(initialMembers);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleDescriptions: Record<UserRole, string> = {
    owner: "Full workspace administrative control & organization settings",
    admin: "Can manage team members, properties, and configurations",
    manager: "Can manage inventory, customers, requirements, and assign agents",
    agent: "Can add & update properties, manage assigned customers & follow-ups",
    viewer: "Read-only access to inventory, matching results, and customers",
  };

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    setLoading(memberId);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateMemberRole(memberId, newRole);
      if (updated) {
        setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
        setMessage(`Updated role to ${newRole}.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Workspace Team & Role-Based Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your authorized real estate staff, brokers, managers, and viewers within your private tenant.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Strict Server-Enforced RBAC & RLS</span>
          <p className="text-blue-700 leading-relaxed">
            Roles and organization memberships are enforced on Postgres Row Level Security.
            Viewers have read-only access. Non-owners cannot elevate their own permissions or tamper with cross-organization records.
          </p>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Active Workspace Members ({members.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                  {member.profile?.full_name?.slice(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {member.profile?.full_name || "Team Member"}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                        member.role === "owner"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : member.role === "admin"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : member.role === "manager"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : member.role === "agent"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5">
                    {member.profile?.phone || "No phone linked"} • Added {formatDate(member.created_at)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {roleDescriptions[member.role]}
                  </p>
                </div>
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">Role:</span>
                <select
                  value={member.role}
                  disabled={loading === member.id}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
