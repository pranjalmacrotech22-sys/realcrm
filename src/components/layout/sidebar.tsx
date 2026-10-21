"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  FileText,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  PlusCircle,
  Menu,
  X,
  LogOut,
  User,
  Mail,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface SidebarProps {
  organizationName?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
  organizationId?: string;
}

export function Sidebar({
  organizationName = "My Workspace",
  userRole = "Owner",
  userName = "Broker",
  userEmail = "broker@realcrm.io",
  organizationId = "",
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingHref(null);
  }, [pathname]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowProfileModal(false);
        if (!isLoggingOut) setShowLogoutConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggingOut]);

  const handleCopyId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    window.location.href = "/api/auth/logout";
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Requirements", href: "/requirements", icon: FileText },
    {
      name: "Property Matching",
      href: "/requirements",
      icon: Sparkles,
      badge: "Smart",
    },
    { name: "Follow-ups", href: "/follow-ups", icon: CalendarCheck },
    { name: "Team", href: "/team", icon: ShieldCheck },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Enterprise Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out text-slate-700 shadow-xs",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Workspace Brand / Header */}
        <div className="h-16 px-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-600/30 group-hover:bg-blue-700 transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 leading-tight tracking-tight">
                  RealCRM
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                  PRO
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                {organizationName}
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Add CTA Button */}
        <div className="p-3">
          <Link
            href="/properties/new"
            prefetch={true}
            onClick={() => {
              setMobileOpen(false);
              setNavigatingHref("/properties/new");
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs shadow-blue-600/25 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3">
            Navigation
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isCurrent =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const isActive = isCurrent || navigatingHref === item.href;
            const isPending = navigatingHref === item.href && !isCurrent;

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  setMobileOpen(false);
                  setNavigatingHref(item.href);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-blue-50/80 text-blue-700 font-semibold border-l-2 border-blue-600 pl-2.5 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600",
                      isPending && "animate-spin"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between gap-1">
            {/* Clickable Profile Section */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1.5 -ml-1 rounded-xl hover:bg-white hover:shadow-2xs hover:border hover:border-slate-200/80 border border-transparent transition-all group cursor-pointer"
              title="Click to view full profile and company details"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/20 group-hover:ring-blue-400 transition">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-500 capitalize">{userRole}</span>
                  <span className="text-[9px] text-slate-400 group-hover:text-slate-600">· Details</span>
                </div>
              </div>
            </button>

            {/* Logout Trigger Button */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out / Switch Workspace"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          LOGOUT CONFIRMATION MODAL (LIGHT THEME)
          ========================================================================= */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 text-slate-800"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="logout-title" className="text-base font-bold text-slate-900 tracking-tight">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to sign out from <span className="font-semibold text-slate-900">{organizationName}</span>?
                </p>
              </div>
            </div>

            {/* User Identity Snapshot */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/20 shrink-0">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 capitalize">
                {userRole}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Confirm Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PROFILE & WORKSPACE DETAILS MODAL (LIGHT THEME)
          ========================================================================= */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="profile-title" className="text-sm font-bold text-slate-900 tracking-tight">
                    User Profile & Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Active identity & workspace details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                aria-label="Close profile modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Hero Section */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-500/20">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-50" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-slate-900 truncate">{userName}</h4>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {userRole}
                    </span>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Session
                    </span>
                  </div>
                </div>
              </div>

              {/* Identity Detail Cards */}
              <div className="space-y-2.5">
                {/* 1. Name */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Full Name
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {userName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Mail ID */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Email Address
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate block">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Verified OTP
                  </span>
                </div>

                {/* 3. Company Name */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Company Name
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate block">
                        {organizationName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    Workspace
                  </span>
                </div>

                {/* 4. Role & Permissions */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Role & Security Level
                      </span>
                      <span className="text-xs font-semibold text-slate-900 capitalize">
                        {userRole} — Workspace Access
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Organization Tenant ID */}
                {organizationId && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Organization Tenant ID
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 truncate block">
                          {organizationId}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyId(organizationId)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer flex items-center gap-1 shrink-0"
                      title="Copy Workspace ID"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
              <Link
                href="/settings"
                onClick={() => setShowProfileModal(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Workspace Settings</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
