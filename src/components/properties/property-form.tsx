"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  Info,
  DollarSign,
  MapPin,
  Home,
  User,
  ShieldAlert,
} from "lucide-react";
import { Property, PropertyPurpose, PropertyCategory, PropertyType } from "@/types";
import { propertySchema } from "@/lib/validations";

interface PropertyFormProps {
  initialData?: Property;
  isEditing?: boolean;
}

export function PropertyForm({ initialData, isEditing = false }: PropertyFormProps) {
  const router = useRouter();

  // Form states
  const [propertyCode, setPropertyCode] = useState(
    initialData?.property_code || `PROP-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Classification
  const [purpose, setPurpose] = useState<PropertyPurpose>(initialData?.purpose || "rent");
  const [category, setCategory] = useState<PropertyCategory>(
    initialData?.category || "residential"
  );
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialData?.property_type || "flat"
  );

  // Location
  const [city, setCity] = useState(initialData?.city || "New Delhi");
  const [locality, setLocality] = useState(initialData?.locality || "Dwarka");
  const [sector, setSector] = useState(initialData?.sector || "Sector 12");
  const [societyName, setSocietyName] = useState(initialData?.society_name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [pincode, setPincode] = useState(initialData?.pincode || "110078");

  // Pricing
  const [priceAmount, setPriceAmount] = useState(
    initialData?.price_amount ? String(initialData.price_amount) : ""
  );
  const [rentPeriod, setRentPeriod] = useState<string>(
    initialData?.rent_period || (purpose === "sale" ? "" : "month")
  );
  const [maintenanceAmount, setMaintenanceAmount] = useState(
    initialData?.maintenance_amount ? String(initialData.maintenance_amount) : "0"
  );
  const [isNegotiable, setIsNegotiable] = useState(initialData?.is_negotiable ?? false);

  // Residential details
  const [bhk, setBhk] = useState(initialData?.bhk ? String(initialData.bhk) : "3");
  const [bathrooms, setBathrooms] = useState(
    initialData?.bathrooms ? String(initialData.bathrooms) : "3"
  );
  const [balconies, setBalconies] = useState(
    initialData?.balconies ? String(initialData.balconies) : "2"
  );
  const [furnishingStatus, setFurnishingStatus] = useState(
    initialData?.furnishing_status || "semi_furnished"
  );
  const [floorNumber, setFloorNumber] = useState(
    initialData?.floor_number != null ? String(initialData.floor_number) : "4"
  );
  const [totalFloors, setTotalFloors] = useState(
    initialData?.total_floors != null ? String(initialData.total_floors) : "10"
  );
  const [parking, setParking] = useState(initialData?.parking || "1 Covered");

  // Area
  const [carpetAreaSqft, setCarpetAreaSqft] = useState(
    initialData?.carpet_area_sqft ? String(initialData.carpet_area_sqft) : ""
  );
  const [builtupAreaSqft, setBuiltupAreaSqft] = useState(
    initialData?.builtup_area_sqft ? String(initialData.builtup_area_sqft) : ""
  );
  const [plotAreaSqft, setPlotAreaSqft] = useState(
    initialData?.plot_area_sqft ? String(initialData.plot_area_sqft) : ""
  );

  // Commercial
  const [frontageFt, setFrontageFt] = useState(
    initialData?.frontage_ft ? String(initialData.frontage_ft) : ""
  );
  const [permittedUse, setPermittedUse] = useState(initialData?.permitted_use || "");
  const [leaseTermMonths, setLeaseTermMonths] = useState(
    initialData?.lease_term_months ? String(initialData.lease_term_months) : ""
  );

  // Plot
  const [plotWidthFt, setPlotWidthFt] = useState(
    initialData?.plot_width_ft ? String(initialData.plot_width_ft) : ""
  );
  const [plotLengthFt, setPlotLengthFt] = useState(
    initialData?.plot_length_ft ? String(initialData.plot_length_ft) : ""
  );
  const [roadWidthFt, setRoadWidthFt] = useState(
    initialData?.road_width_ft ? String(initialData.road_width_ft) : ""
  );
  const [landUse, setLandUse] = useState(initialData?.land_use || "");

  // Owner details
  const [ownerName, setOwnerName] = useState(initialData?.owner_name || "");
  const [ownerPhone, setOwnerPhone] = useState(initialData?.owner_phone || "");
  const [sourceType, setSourceType] = useState(initialData?.source_type || "direct_owner");

  // Availability
  const [availabilityStatus, setAvailabilityStatus] = useState(
    initialData?.availability_status || "available"
  );
  const [availableFrom, setAvailableFrom] = useState(initialData?.available_from || "");

  // Media (Images)
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialData?.media?.map((m) => m.url || "").filter(Boolean) || []
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Duplicate Check on Blur of Code or Society
  async function performDuplicateCheck() {
    if (!propertyCode || !sector) return;
    try {
      const res = await fetch("/api/properties/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: propertyCode,
          sector,
          society: societyName,
          excludeId: initialData?.id,
        }),
      });
      const check = await res.json();
      if (check.isDuplicate && check.reason) {
        setDuplicateWarning(check.reason);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Non-blocking
    }
  }

  function handleAddImage() {
    if (!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl("");
  }

  function handleRemoveImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const code = propertyCode.trim() || `PROP-${Math.floor(1000 + Math.random() * 9000)}`;
      const derivedTitle =
        title.trim() ||
        `${bhk ? bhk + " BHK " : ""}${propertyType.replace("_", " ")}${societyName ? " at " + societyName : sector ? " in " + sector : ""}`.trim() ||
        "Property Listing";
      const derivedCity = city.trim() || "New Delhi";
      const derivedSector = sector.trim() || "General";
      const derivedOwner = ownerName.trim() || "Direct Listing";
      const derivedPhone = ownerPhone.trim() || "";
      const price = priceAmount ? Number(priceAmount) : 0;

      const payload = {
        property_code: code,
        title: derivedTitle,
        description: description || null,
        purpose,
        category,
        property_type: propertyType,
        city: derivedCity,
        locality: locality || null,
        sector: derivedSector,
        society_name: societyName || null,
        address: address || null,
        pincode: pincode || null,
        price_amount: price,
        rent_period: purpose === "sale" ? null : (rentPeriod as any) || "month",
        maintenance_amount: maintenanceAmount ? Number(maintenanceAmount) : 0,
        is_negotiable: isNegotiable,

        bhk: category === "residential" && bhk ? Number(bhk) : null,
        bathrooms: category === "residential" && bathrooms ? Number(bathrooms) : null,
        balconies: category === "residential" && balconies ? Number(balconies) : null,
        furnishing_status: category === "residential" ? (furnishingStatus as any) : null,
        floor_number: floorNumber ? Number(floorNumber) : null,
        total_floors: totalFloors ? Number(totalFloors) : null,
        parking: parking || null,

        carpet_area_sqft: carpetAreaSqft ? Number(carpetAreaSqft) : null,
        builtup_area_sqft: builtupAreaSqft ? Number(builtupAreaSqft) : null,
        plot_area_sqft: plotAreaSqft ? Number(plotAreaSqft) : null,

        frontage_ft: category === "commercial" && frontageFt ? Number(frontageFt) : null,
        permitted_use: category === "commercial" ? permittedUse : null,
        lease_term_months:
          category === "commercial" && leaseTermMonths ? Number(leaseTermMonths) : null,

        plot_width_ft: category === "land" && plotWidthFt ? Number(plotWidthFt) : null,
        plot_length_ft: category === "land" && plotLengthFt ? Number(plotLengthFt) : null,
        road_width_ft: category === "land" && roadWidthFt ? Number(roadWidthFt) : null,
        land_use: category === "land" ? landUse : null,

        owner_name: derivedOwner,
        owner_phone: derivedPhone,
        source_type: sourceType || null,
        availability_status: availabilityStatus as any,
        available_from: availableFrom || null,
      };

      // Zod Validation with non-mandatory defaults
      const parsed = propertySchema.safeParse(payload);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Validation failed";
        setError(firstError);
        setLoading(false);
        return;
      }

      const mediaItems = imageUrls.map((url, idx) => ({
        id: `med-${Date.now()}-${idx}`,
        organization_id: initialData?.organization_id || "",
        property_id: initialData?.id || "temp-prop",
        storage_path: `media/${idx}.jpg`,
        media_type: "image" as const,
        caption: `Photo ${idx + 1}`,
        sort_order: idx,
        created_at: new Date().toISOString(),
        url,
      }));

      if (isEditing && initialData) {
        const res = await fetch(`/api/properties/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            media: mediaItems,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to update property");
        }

        router.push(`/properties/${initialData.id}`);
        router.refresh();
      } else {
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            media: mediaItems,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to create property");
        }

        router.push(`/properties/${result.property.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving property");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Back link */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {isEditing ? `Edit Property (${initialData?.property_code})` : "Add Property to Inventory"}
            </h1>
            <p className="text-xs text-slate-500">
              Internal private record for your organization.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/properties"
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
          >
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Save Property"}
          </button>
        </div>
      </div>

      {/* Duplicate Warning Alert */}
      {duplicateWarning && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Possible Duplicate Warning</span>
            <span>{duplicateWarning}</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Basic Information */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>1. Basic Information</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Code
            </label>
            <input
              type="text"
              value={propertyCode}
              onChange={(e) => setPropertyCode(e.target.value)}
              onBlur={performDuplicateCheck}
              placeholder="e.g. PROP-1001 (auto-generated if blank)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Listing Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3 BHK Luxury Apartment in Platinum Heights"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Internal Description & Highlights
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description, amenities, park facing, modular kitchen, maintenance details..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* SECTION 2: Property Classification */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-600" />
          <span>2. Property Classification</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => {
                const newPurpose = e.target.value as PropertyPurpose;
                setPurpose(newPurpose);
                if (newPurpose === "sale") {
                  setRentPeriod("");
                } else if (!rentPeriod) {
                  setRentPeriod("month");
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
              <option value="lease">Commercial Lease</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
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
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="flat">Flat / Apartment</option>
              <option value="builder_floor">Builder Floor</option>
              <option value="villa">Villa / Independent House</option>
              <option value="plot">Plot / Land Parcel</option>
              <option value="shop">Retail Shop</option>
              <option value="office">Office Space</option>
              <option value="warehouse">Warehouse</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Location */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>3. Location</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. New Delhi"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sector / Sub-locality
            </label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              onBlur={performDuplicateCheck}
              placeholder="e.g. Sector 12"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Society / Project Name
            </label>
            <input
              type="text"
              value={societyName}
              onChange={(e) => setSocietyName(e.target.value)}
              onBlur={performDuplicateCheck}
              placeholder="e.g. Platinum Heights CGHS"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Unit Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat 702, Tower B, Plot 4"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="6-digit PIN"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Price & Rent Period */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span>4. Pricing & Commercials</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {purpose === "sale" ? "Total Sale Price (₹)" : "Rent / Lease Amount (₹)"}
            </label>
            <input
              type="number"
              min={0}
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder={purpose === "sale" ? "e.g. 42500000" : "e.g. 45000"}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
            />
          </div>

          {/* Conditional Rent Period for rent/lease */}
          {purpose !== "sale" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rent Period
              </label>
              <select
                value={rentPeriod}
                onChange={(e) => setRentPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="month">Per Month</option>
                <option value="week">Per Week</option>
                <option value="day">Per Day</option>
                <option value="year">Per Year</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Maintenance (₹)
            </label>
            <input
              type="number"
              min={0}
              value={maintenanceAmount}
              onChange={(e) => setMaintenanceAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isNegotiable"
            checked={isNegotiable}
            onChange={(e) => setIsNegotiable(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
          />
          <label htmlFor="isNegotiable" className="text-xs text-slate-700 select-none">
            Price is negotiable with owner
          </label>
        </div>
      </div>

      {/* SECTION 5: Conditional Specs: Residential (BHK / Furnishing) */}
      {category === "residential" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Home className="w-4 h-4 text-blue-600" />
            <span>5. Residential Configuration</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BHK</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="2.5">2.5 BHK</option>
                <option value="3">3 BHK</option>
                <option value="3.5">3.5 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Furnishing
              </label>
              <select
                value={furnishingStatus}
                onChange={(e) => setFurnishingStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi-Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                min={1}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Balconies</label>
              <input
                type="number"
                min={0}
                value={balconies}
                onChange={(e) => setBalconies(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floor Number
              </label>
              <input
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Floors</label>
              <input
                type="number"
                min={1}
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parking</label>
              <input
                type="text"
                value={parking}
                onChange={(e) => setParking(e.target.value)}
                placeholder="1 Covered Stilt / 2 Basement"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5 (Commercial): Frontage & Use */}
      {category === "commercial" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>5. Commercial Specifications</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frontage (ft)
              </label>
              <input
                type="number"
                value={frontageFt}
                onChange={(e) => setFrontageFt(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permitted Use
              </label>
              <input
                type="text"
                value={permittedUse}
                onChange={(e) => setPermittedUse(e.target.value)}
                placeholder="e.g. Retail / Cafe / Bank"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lease Term (Months)
              </label>
              <input
                type="number"
                value={leaseTermMonths}
                onChange={(e) => setLeaseTermMonths(e.target.value)}
                placeholder="e.g. 36"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5 (Plots / Land): Dimensions & Road */}
      {category === "land" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>5. Plot / Land Specifications</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plot Width (ft)
              </label>
              <input
                type="number"
                value={plotWidthFt}
                onChange={(e) => setPlotWidthFt(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plot Length (ft)
              </label>
              <input
                type="number"
                value={plotLengthFt}
                onChange={(e) => setPlotLengthFt(e.target.value)}
                placeholder="e.g. 60"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Road Width (ft)
              </label>
              <input
                type="number"
                value={roadWidthFt}
                onChange={(e) => setRoadWidthFt(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Land Use</label>
              <input
                type="text"
                value={landUse}
                onChange={(e) => setLandUse(e.target.value)}
                placeholder="e.g. Residential Villa"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Area Dimensions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>6. Area Measurements (Sq. Ft.)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Built-up Area (sqft)
            </label>
            <input
              type="number"
              value={builtupAreaSqft}
              onChange={(e) => setBuiltupAreaSqft(e.target.value)}
              placeholder="e.g. 1750"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Carpet Area (sqft)
            </label>
            <input
              type="number"
              value={carpetAreaSqft}
              onChange={(e) => setCarpetAreaSqft(e.target.value)}
              placeholder="e.g. 1450"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plot Area (sqft)
            </label>
            <input
              type="number"
              value={plotAreaSqft}
              onChange={(e) => setPlotAreaSqft(e.target.value)}
              placeholder="e.g. 2700"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: Photos & Documents */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>7. Photos & Media</span>
        </h2>
        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Paste image URL (e.g. Unsplash or Supabase Storage signed URL)..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition"
          >
            Add Photo
          </button>
        </div>

        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {imageUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden border border-slate-200 h-28 group"
              >
                <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 8: Owner Details (Private) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>8. Owner & Source Details (Protected)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Owner Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Rajesh Kumar Gupta"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Owner Phone
            </label>
            <input
              type="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+91 98111 22334"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lead Source
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="direct_owner">Direct Owner</option>
              <option value="referral">Referral</option>
              <option value="broker_network">Broker Network</option>
              <option value="builder_direct">Builder Direct</option>
              <option value="newspaper_ad">Newspaper / Print Ad</option>
              <option value="walk_in">Walk-in</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 9: Availability Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>9. Availability & Timeline</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Availability Status
            </label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="available">Available</option>
              <option value="on_hold">On Hold</option>
              <option value="under_negotiation">Under Negotiation</option>
              <option value="rented">Rented</option>
              <option value="sold">Sold</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available From Date
            </label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Submit footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link
          href="/properties"
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Save Property to Inventory"}
        </button>
      </div>
    </form>
  );
}
