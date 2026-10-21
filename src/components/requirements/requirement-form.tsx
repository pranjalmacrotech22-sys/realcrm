"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Customer, PropertyPurpose, PropertyCategory, PropertyType } from "@/types";
import { requirementSchema } from "@/lib/validations";

interface RequirementFormProps {
  customers: Customer[];
  defaultCustomerId?: string;
}

export function RequirementForm({ customers, defaultCustomerId }: RequirementFormProps) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState(
    defaultCustomerId || (customers[0]?.id ?? "")
  );
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<PropertyPurpose>("rent");
  const [category, setCategory] = useState<PropertyCategory>("residential");
  const [propertyType, setPropertyType] = useState<PropertyType>("flat");

  // Budget
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<string>("month");

  // Specs
  const [minBhk, setMinBhk] = useState("3");
  const [maxBhk, setMaxBhk] = useState("3");
  const [preferredFurnishing, setPreferredFurnishing] = useState("semi_furnished");

  // Multi-Locations
  const [locations, setLocations] = useState<
    { city: string; sector: string; locality: string; priority: number }[]
  >([{ city: "New Delhi", sector: "Sector 12", locality: "Dwarka", priority: 1 }]);

  // Flexibility Toggles
  const [allowNearbyLocations, setAllowNearbyLocations] = useState(false);
  const [allowAlternatePropertyTypes, setAllowAlternatePropertyTypes] = useState(false);
  const [allowAlternateFurnishing, setAllowAlternateFurnishing] = useState(false);
  const [budgetFlexibilityPercent, setBudgetFlexibilityPercent] = useState("0");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddLocation() {
    setLocations([
      ...locations,
      { city: "New Delhi", sector: "", locality: "", priority: locations.length + 1 },
    ]);
  }

  function handleRemoveLocation(idx: number) {
    if (locations.length <= 1) return;
    setLocations(locations.filter((_, i) => i !== idx));
  }

  function updateLocation(idx: number, field: string, val: any) {
    const updated = [...locations];
    (updated[idx] as any)[field] = val;
    setLocations(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        customer_id: customerId,
        title: title.trim() || `${minBhk || ""} BHK ${propertyType} in ${locations[0]?.sector || "City"}`,
        purpose,
        category,
        property_type: propertyType,
        min_budget: minBudget ? Number(minBudget) : null,
        max_budget: Number(maxBudget),
        budget_period: purpose === "sale" ? null : (budgetPeriod as any) || "month",
        min_bhk: category === "residential" && minBhk ? Number(minBhk) : null,
        max_bhk: category === "residential" && maxBhk ? Number(maxBhk) : null,
        preferred_furnishing:
          category === "residential" ? (preferredFurnishing as any) : null,
        allow_nearby_locations: allowNearbyLocations,
        allow_alternate_property_types: allowAlternatePropertyTypes,
        allow_alternate_furnishing: allowAlternateFurnishing,
        budget_flexibility_percent: Number(budgetFlexibilityPercent) || 0,
        status: "active" as const,
        locations: locations.filter((l) => l.sector.trim().length > 0),
      };

      const parsed = requirementSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || "Validation failed");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create requirement");
      }

      // Directly navigate to smart matching view!
      router.push(`/matches/${result.requirement.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving requirement");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/requirements"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Add Customer Requirement</h1>
            <p className="text-xs text-slate-500">
              Set customer criteria, preferred sectors, and flexibility rules.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/requirements"
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? "Matching..." : "Save & Find Matches"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Client & Classification */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          1. Client & Property Classification
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Client / Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone}) - {c.customer_type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Requirement Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3 BHK Flat in Dwarka for Corporate Executive"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose *</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="rent">Rent</option>
              <option value="sale">Buy / Purchase</option>
              <option value="lease">Lease</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PropertyCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land & Plots</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Property Type *
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="flat">Flat / Apartment</option>
              <option value="builder_floor">Builder Floor</option>
              <option value="villa">Villa / House</option>
              <option value="plot">Plot</option>
              <option value="shop">Shop</option>
              <option value="office">Office</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Budget */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          2. Budget Range
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Budget (₹)
            </label>
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="e.g. 35000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Maximum Budget (₹) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
            />
          </div>

          {purpose !== "sale" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Budget Period *
              </label>
              <select
                value={budgetPeriod}
                onChange={(e) => setBudgetPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Residential Specs */}
      {category === "residential" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            3. Bedrooms & Furnishing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min BHK</label>
              <select
                value={minBhk}
                onChange={(e) => setMinBhk(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max BHK</label>
              <select
                value={maxBhk}
                onChange={(e) => setMaxBhk(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Furnishing
              </label>
              <select
                value={preferredFurnishing}
                onChange={(e) => setPreferredFurnishing(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="semi_furnished">Semi-Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Multi-location Preferences */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>4. Target Sectors & Localities</span>
          </h2>
          <button
            type="button"
            onClick={handleAddLocation}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sector / Area</span>
          </button>
        </div>

        <div className="space-y-3">
          {locations.map((loc, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              <span className="text-[11px] font-bold text-slate-400 w-6">#{idx + 1}</span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Sector / Area (e.g. Sector 12)"
                  value={loc.sector}
                  onChange={(e) => updateLocation(idx, "sector", e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="City (e.g. New Delhi)"
                  value={loc.city}
                  onChange={(e) => updateLocation(idx, "city", e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
              </div>
              {locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: Matching Flexibility Rules (Section 12 of spec) */}
      <div className="bg-white p-5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>5. Smart Matching Engine Flexibility Rules</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Exact matches must satisfy all criteria. Near matches will only be permitted if the corresponding flexibility rule is enabled below.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allowNearbyLocations}
              onChange={(e) => setAllowNearbyLocations(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm border-slate-300"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Allow Nearby Sectors & Localities
              </span>
              <span className="text-[11px] text-slate-500">
                Show properties located in adjacent sectors within the same city as Near Matches.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAlternatePropertyTypes}
              onChange={(e) => setAllowAlternatePropertyTypes(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm border-slate-300"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Allow Alternate Property Types (within same category)
              </span>
              <span className="text-[11px] text-slate-500">
                e.g. Include Builder Floors or Villas if user requested Flats.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAlternateFurnishing}
              onChange={(e) => setAllowAlternateFurnishing(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm border-slate-300"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Allow Alternate Furnishing
              </span>
              <span className="text-[11px] text-slate-500">
                Include Semi-Furnished or Fully Furnished properties as near matches with mismatch tags.
              </span>
            </div>
          </label>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-800">
                Budget Flexibility Percentage: {budgetFlexibilityPercent}%
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Allows up to ₹
                {(
                  Number(maxBudget || 0) *
                  (1 + Number(budgetFlexibilityPercent || 0) / 100)
                ).toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="5"
              value={budgetFlexibilityPercent}
              onChange={(e) => setBudgetFlexibilityPercent(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Strict Cap)</span>
              <span>10% (Recommended)</span>
              <span>25% (High Flex)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link
          href="/requirements"
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loading ? "Evaluating..." : "Save Requirement & Find Matches"}</span>
        </button>
      </div>
    </form>
  );
}
