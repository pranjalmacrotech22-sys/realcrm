"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Search,
  Filter,
  Plus,
  SlidersHorizontal,
  Grid3X3,
  List,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowUpDown,
  Home,
  Building,
  RotateCcw,
  Sparkles,
  Phone,
  Shield,
  Layers,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Property, PropertyFilters } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PropertyListViewProps {
  initialProperties: Property[];
  totalCount: number;
}

export function PropertyListView({
  initialProperties,
  totalCount,
}: PropertyListViewProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Keep state in sync with server re-renders or navigations
  useEffect(() => {
    setProperties(initialProperties);
  }, [initialProperties]);

  // Listen for global mutation events across the app
  useEffect(() => {
    const handler = () => router.refresh();
    window.addEventListener("realcrm:refresh", handler);
    return () => window.removeEventListener("realcrm:refresh", handler);
  }, [router]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [purpose, setPurpose] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [bhk, setBhk] = useState<string>("all");
  const [furnishing, setFurnishing] = useState<string>("all");
  const [availability, setAvailability] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Unique sectors present in inventory
  const sectors = useMemo(() => {
    const set = new Set<string>();
    initialProperties.forEach((p) => {
      if (p.sector) set.add(p.sector);
    });
    return Array.from(set).sort();
  }, [initialProperties]);

  // Client-side instant filtering & sorting
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Archived filter
        if (showArchived) {
          if (!p.archived_at) return false;
        } else {
          if (p.archived_at) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match =
            p.property_code.toLowerCase().includes(q) ||
            p.title.toLowerCase().includes(q) ||
            p.sector.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            (p.society_name && p.society_name.toLowerCase().includes(q)) ||
            p.owner_name.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Purpose
        if (purpose !== "all" && p.purpose !== purpose) return false;

        // Category
        if (category !== "all" && p.category !== category) return false;

        // Type
        if (propertyType !== "all" && p.property_type !== propertyType) return false;

        // Sector
        if (sector !== "all" && p.sector !== sector) return false;

        // BHK
        if (bhk !== "all" && p.bhk !== Number(bhk)) return false;

        // Furnishing
        if (furnishing !== "all" && p.furnishing_status !== furnishing) return false;

        // Availability
        if (availability !== "all" && p.availability_status !== availability) return false;

        // Min Price
        if (minPrice && p.price_amount < Number(minPrice)) return false;

        // Max Price
        if (maxPrice && p.price_amount > Number(maxPrice)) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === "price_amount") {
          comp = a.price_amount - b.price_amount;
        } else if (sortBy === "last_verified_at") {
          comp =
            new Date(a.last_verified_at || 0).getTime() -
            new Date(b.last_verified_at || 0).getTime();
        } else {
          comp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === "desc" ? -comp : comp;
      });
  }, [
    properties,
    searchQuery,
    purpose,
    category,
    propertyType,
    sector,
    bhk,
    furnishing,
    availability,
    minPrice,
    maxPrice,
    showArchived,
    sortBy,
    sortOrder,
  ]);

  const activeFilterCount = [
    purpose !== "all",
    category !== "all",
    propertyType !== "all",
    sector !== "all",
    bhk !== "all",
    furnishing !== "all",
    availability !== "all",
    Boolean(minPrice),
    Boolean(maxPrice),
    showArchived,
  ].filter(Boolean).length;

  function clearAllFilters() {
    setSearchQuery("");
    setPurpose("all");
    setCategory("all");
    setPropertyType("all");
    setSector("all");
    setBhk("all");
    setFurnishing("all");
    setAvailability("all");
    setMinPrice("");
    setMaxPrice("");
    setShowArchived(false);
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Property Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your internal listings, specs, availability, and owner contacts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* Search & Main Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (PROP-1001), society, sector, or owner name..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Purpose Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {["all", "rent", "sale", "lease"].map((p) => (
              <button
                key={p}
                onClick={() => setPurpose(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  purpose === p
                    ? "bg-white text-blue-700 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p === "all" ? "All Purposes" : p}
              </button>
            ))}
          </div>

          {/* Filter Drawer Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View Toggle (Grid / Table) */}
          <div className="hidden sm:flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid" ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${
                viewMode === "table" ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="all">All Categories</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land & Plots</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="all">All Types</option>
                <option value="flat">Flat / Apartment</option>
                <option value="builder_floor">Builder Floor</option>
                <option value="villa">Villa / House</option>
                <option value="plot">Plot / Land</option>
                <option value="shop">Retail Shop</option>
                <option value="office">Office Space</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Sector / Locality
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="all">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* BHK */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                BHK (Bedrooms)
              </label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="all">Any BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            {/* Furnishing */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Furnishing
              </label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="all">Any Furnishing</option>
                <option value="fully_furnished">Fully Furnished</option>
                <option value="semi_furnished">Semi Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Status
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available Only</option>
                <option value="on_hold">On Hold</option>
                <option value="under_negotiation">Under Negotiation</option>
                <option value="rented">Rented</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Bar & Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">
              Showing {filteredProperties.length} of {totalCount} properties
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-800"
            >
              <option value="created_at">Date Added</option>
              <option value="price_amount">Price</option>
              <option value="last_verified_at">Last Verified</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1 border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600"
              title={`Sort order: ${sortOrder}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Inventory
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {properties.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">properties</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Available Immediately
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 tracking-tight">
              {properties.filter((p) => p.availability_status === "available" && !p.archived_at).length}
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-100 font-medium">
              Ready
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Rental Listings
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-blue-600 tracking-tight">
              {properties.filter((p) => p.purpose === "rent" && !p.archived_at).length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">units</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sale & Resale
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-indigo-600 tracking-tight">
              {properties.filter((p) => p.purpose === "sale" && !p.archived_at).length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">assets</span>
          </div>
        </div>
      </div>

      {/* Property Results List */}
      {filteredProperties.length === 0 ? (
        totalCount === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3 shadow-2xs">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Your Property Inventory is Ready</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              Start adding residential flats, builder floors, luxury villas, plots, or commercial retail spaces to manage your inventory and match client requirements.
            </p>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Property</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching properties found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              No properties match your current search and filter criteria. Try adjusting your query or resetting all filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden group"
            >
              {/* Image / Blueprint Architectural Thumbnail */}
              <div className="relative h-44 bg-slate-950 overflow-hidden">
                {prop.media && prop.media.length > 0 ? (
                  <img
                    src={prop.media[0].url}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-center">
                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 mb-2 relative z-10">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-white relative z-10 capitalize">
                      {prop.category} • {prop.property_type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 relative z-10 mt-0.5">
                      {prop.sector}, {prop.city}
                    </span>
                  </div>
                )}

                {/* Badges on Image */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-950/80 text-white backdrop-blur-md border border-white/10">
                    {prop.property_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md text-white shadow-xs ${
                      prop.purpose === "rent"
                        ? "bg-blue-600/90"
                        : "bg-emerald-600/90"
                    }`}
                  >
                    {prop.purpose}
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md text-white capitalize shadow-xs ${
                      prop.availability_status === "available"
                        ? "bg-emerald-500/90"
                        : "bg-amber-500/90"
                    }`}
                  >
                    {prop.availability_status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Content Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                        {formatCurrency(prop.price_amount)}
                      </span>
                      {prop.rent_period && (
                        <span className="text-xs font-normal text-slate-500">
                          /{prop.rent_period}
                        </span>
                      )}
                    </div>
                    {prop.is_negotiable && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-100">
                        Negotiable
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/properties/${prop.id}`}
                    className="block text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 leading-snug"
                  >
                    {prop.title}
                  </Link>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {prop.society_name ? `${prop.society_name}, ` : ""}
                      {prop.sector}, {prop.city}
                    </span>
                  </p>

                  {/* Property Specs Pill Grid */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                    {prop.bhk && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200/80 font-bold text-slate-800">
                        {prop.bhk} BHK
                      </span>
                    )}
                    {prop.furnishing_status && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 capitalize">
                        {prop.furnishing_status.replace("_", " ")}
                      </span>
                    )}
                    {(prop.builtup_area_sqft || prop.carpet_area_sqft || prop.plot_area_sqft) && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 font-mono">
                        {prop.builtup_area_sqft || prop.carpet_area_sqft || prop.plot_area_sqft} sqft
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 capitalize">
                      {prop.property_type.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Footer Owner and Fast Action Strip */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[140px]">
                    <span className="truncate">
                      Owner: <strong className="text-slate-800 font-semibold">{prop.owner_name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Instant Matching Shortcut */}
                    <Link
                      href={`/requirements?matchPropertyId=${prop.id}`}
                      title="Find Matching Requirements"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Match</span>
                    </Link>

                    {/* View Details Link */}
                    <Link
                      href={`/properties/${prop.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Property Title</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Specs</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Owner Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {prop.property_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      <Link href={`/properties/${prop.id}`} className="hover:text-blue-600">
                        {prop.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 truncate max-w-xs text-slate-600">
                      {prop.sector}, {prop.city}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-700">
                      {prop.bhk ? `${prop.bhk} BHK ` : ""}
                      {prop.property_type.replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                      {formatCurrency(prop.price_amount)}
                      {prop.rent_period && `/${prop.rent_period}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${
                          prop.availability_status === "available"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {prop.availability_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{prop.owner_name}</span>
                        <a href={`tel:${prop.owner_phone}`} className="text-blue-600 hover:underline text-[11px] font-mono">
                          {prop.owner_phone}
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/requirements?matchPropertyId=${prop.id}`}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200"
                          title="Match against requirements"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/properties/${prop.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200"
                        >
                          Details
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
