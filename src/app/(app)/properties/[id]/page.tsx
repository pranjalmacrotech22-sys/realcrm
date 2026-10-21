import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  Shield,
  Edit,
  Sparkles,
  Archive,
  CheckCircle2,
  Clock,
  Home,
  Tag,
  Share2,
} from "lucide-react";
import { getPropertyById, getActivities } from "@/lib/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PropertyDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  const activities = await getActivities({ propertyId: property.id });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-white">
                {property.property_code}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                  property.purpose === "rent"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                For {property.purpose}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                  property.availability_status === "available"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {property.availability_status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{property.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/requirements?matchPropertyId=${property.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Matching Requirements</span>
          </Link>
          <Link
            href={`/properties/${property.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photos & Primary Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery or Architectural Blueprint Hero */}
          {property.media && property.media.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="h-80 bg-slate-100 overflow-hidden">
                <img
                  src={property.media[0].url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.media.length > 1 && (
                <div className="p-3 border-t border-slate-100 grid grid-cols-4 gap-2">
                  {property.media.map((med, idx) => (
                    <div key={idx} className="h-16 rounded-xl overflow-hidden border border-slate-200">
                      <img src={med.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-2xl border border-slate-800 p-8 text-white relative overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {property.property_code}
                    </span>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
                      {property.category} • {property.property_type.replace("_", " ")}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {property.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {property.society_name ? `${property.society_name}, ` : ""}
                      {property.sector}, {property.city}
                    </span>
                  </p>
                </div>
                <div className="shrink-0 bg-white/5 border border-white/10 rounded-xl p-4 text-right backdrop-blur-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Listing Price
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    {formatCurrency(property.price_amount)}
                  </span>
                  {property.rent_period && (
                    <span className="text-xs text-slate-400 ml-1">/{property.rent_period}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Property Description & Overview
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description || "No detailed description provided for this listing."}
            </p>
          </div>

          {/* Detailed Specifications Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Property Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Category / Type</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {property.category} • {property.property_type.replace("_", " ")}
                </span>
              </div>

              {property.bhk && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Bedrooms (BHK)</span>
                  <span className="font-semibold text-slate-900">{property.bhk} BHK</span>
                </div>
              )}

              {property.furnishing_status && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Furnishing</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {property.furnishing_status.replace("_", " ")}
                  </span>
                </div>
              )}

              {property.bathrooms && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Bathrooms</span>
                  <span className="font-semibold text-slate-900">{property.bathrooms}</span>
                </div>
              )}

              {property.balconies && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Balconies</span>
                  <span className="font-semibold text-slate-900">{property.balconies}</span>
                </div>
              )}

              {property.floor_number != null && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Floor</span>
                  <span className="font-semibold text-slate-900">
                    Floor {property.floor_number} of {property.total_floors || "N/A"}
                  </span>
                </div>
              )}

              {property.carpet_area_sqft && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Carpet Area</span>
                  <span className="font-semibold text-slate-900">{property.carpet_area_sqft} sq.ft.</span>
                </div>
              )}

              {property.builtup_area_sqft && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Super Built-up Area</span>
                  <span className="font-semibold text-slate-900">{property.builtup_area_sqft} sq.ft.</span>
                </div>
              )}

              {property.parking && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Reserved Parking</span>
                  <span className="font-semibold text-slate-900">{property.parking}</span>
                </div>
              )}

              {/* Commercial Specs */}
              {property.frontage_ft && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Shop Frontage</span>
                  <span className="font-semibold text-slate-900">{property.frontage_ft} ft.</span>
                </div>
              )}

              {property.permitted_use && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Permitted Use</span>
                  <span className="font-semibold text-slate-900">{property.permitted_use}</span>
                </div>
              )}

              {/* Plot Specs */}
              {property.plot_area_sqft && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Plot Area</span>
                  <span className="font-semibold text-slate-900">{property.plot_area_sqft} sq.ft.</span>
                </div>
              )}

              {property.road_width_ft && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Facing Road Width</span>
                  <span className="font-semibold text-slate-900">{property.road_width_ft} ft.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Owner info, Location */}
        <div className="space-y-6">
          {/* Commercials Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pricing Details
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(property.price_amount)}
              </span>
              {property.rent_period && (
                <span className="text-xs text-slate-500 ml-1">/{property.rent_period}</span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Maintenance:</span>
                <span className="font-medium text-slate-800">
                  {property.maintenance_amount ? formatCurrency(property.maintenance_amount) : "Included"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price Negotiation:</span>
                <span className="font-medium text-slate-800">
                  {property.is_negotiable ? "Negotiable" : "Fixed Price"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available From:</span>
                <span className="font-medium text-slate-800">
                  {property.available_from ? formatDate(property.available_from) : "Immediate"}
                </span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Location Details</span>
            </h2>
            <div className="space-y-2 text-xs">
              {property.society_name && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Society / Complex</span>
                  <span className="font-semibold text-slate-900">{property.society_name}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block text-[11px]">Sector & City</span>
                <span className="font-semibold text-slate-900">
                  {property.sector}, {property.city} {property.pincode ? `- ${property.pincode}` : ""}
                </span>
              </div>
              {property.address && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Unit Address</span>
                  <span className="text-slate-700">{property.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Owner & Lead Contact (Protected Internal Information) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Owner Details (Private)</span>
              </h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                Workspace Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Owner Full Name</span>
                <span className="font-semibold text-slate-900 text-sm">{property.owner_name}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Phone Number</span>
                <a
                  href={`tel:${property.owner_phone}`}
                  className="font-mono font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{property.owner_phone}</span>
                </a>
              </div>

              {property.source_type && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Acquisition Source</span>
                  <span className="text-slate-700 capitalize">
                    {property.source_type.replace("_", " ")}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
                <span>Verified:</span>
                <span>{formatDate(property.last_verified_at)}</span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Activity History</span>
            </h2>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500">No activity logged yet.</p>
              ) : (
                activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="text-xs border-l-2 border-blue-500 pl-2.5 py-0.5">
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
