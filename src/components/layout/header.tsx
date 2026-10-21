"use client";

import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  organizationName?: string;
}

export function Header({
  title,
  subtitle,
  organizationName = "My Real Estate Workspace",
}: HeaderProps) {
  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Spacer for mobile hamburger menu */}
        <div className="w-8 lg:hidden" />
        <div>
          {title ? (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && (
                <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                  — {subtitle}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-800">{organizationName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">

        {/* Quick Requirement Action */}
        <Link
          href="/requirements/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 transition shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">Find Match</span>
        </Link>

        {/* Quick Property Add Action */}
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Property</span>
        </Link>
      </div>
    </header>
  );
}
