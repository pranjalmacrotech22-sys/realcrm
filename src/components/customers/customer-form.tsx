"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ArrowLeft, AlertCircle, Phone, Mail, User, Info } from "lucide-react";
import { customerSchema } from "@/lib/validations";
import { CustomerType } from "@/types";

export function CustomerForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("buyer");
  const [source, setSource] = useState("walk_in");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        alternate_phone: alternatePhone.trim() || null,
        email: email.trim() || null,
        customer_type: customerType,
        source: source || null,
        notes: notes.trim() || null,
      };

      const parsed = customerSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || "Validation failed");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create customer");
      }

      router.push(`/customers/${result.customer.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating customer");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Add New Customer</h1>
            <p className="text-xs text-slate-500">Record customer contact and preference profile.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/customers"
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Customer Information</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Amitabh Sharma"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alternate Phone Number
            </label>
            <input
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="e.g. +91 98765 00000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Type *
            </label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="buyer">Buyer (Looking to Purchase)</option>
              <option value="tenant">Tenant (Looking to Rent)</option>
              <option value="investor">Commercial / Land Investor</option>
              <option value="seller">Seller / Property Owner</option>
              <option value="landlord">Landlord (Lessor)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lead Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
          >
            <option value="walk_in">Walk-in Office</option>
            <option value="referral">Client / Personal Referral</option>
            <option value="website">Company Website</option>
            <option value="newspaper_ad">Print / Hoarding Ad</option>
            <option value="social_media">Social Media (LinkedIn/Insta)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Internal Profile Notes & Requirements Context
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Executive background, family size, reason for relocation, special preferences..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link
          href="/customers"
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Customer Profile"}
        </button>
      </div>
    </form>
  );
}
