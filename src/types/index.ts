export type UserRole = "owner" | "admin" | "manager" | "agent" | "viewer";
export type MembershipStatus = "active" | "disabled" | "invited";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  full_name: string;
  phone?: string | null;
  avatar_path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  organization?: Organization;
}

export type PropertyPurpose = "rent" | "sale" | "lease";
export type PropertyCategory = "residential" | "commercial" | "land";
export type PropertyType =
  | "flat"
  | "builder_floor"
  | "villa"
  | "plot"
  | "shop"
  | "office"
  | "warehouse"
  | "other";

export type FurnishingStatus = "unfurnished" | "semi_furnished" | "fully_furnished";
export type RentPeriod = "month" | "week" | "day" | "year";
export type AvailabilityStatus =
  | "available"
  | "on_hold"
  | "under_negotiation"
  | "sold"
  | "rented"
  | "unavailable";

export interface Property {
  id: string;
  organization_id: string;
  property_code: string;
  title: string;
  description?: string | null;

  // Classification
  purpose: PropertyPurpose;
  category: PropertyCategory;
  property_type: PropertyType;

  // Location
  city: string;
  locality?: string | null;
  sector: string;
  society_name?: string | null;
  address?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Pricing
  price_amount: number;
  rent_period?: RentPeriod | null;
  maintenance_amount?: number | null;
  is_negotiable: boolean;

  // Residential details
  bhk?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  furnishing_status?: FurnishingStatus | null;
  floor_number?: number | null;
  total_floors?: number | null;
  parking?: string | null;

  // Area
  carpet_area_sqft?: number | null;
  builtup_area_sqft?: number | null;
  plot_area_sqft?: number | null;

  // Commercial details
  frontage_ft?: number | null;
  permitted_use?: string | null;
  lease_term_months?: number | null;

  // Plot details
  plot_width_ft?: number | null;
  plot_length_ft?: number | null;
  road_width_ft?: number | null;
  land_use?: string | null;

  // Ownership & management
  owner_name: string;
  owner_phone: string;
  source_type?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;

  // Availability
  availability_status: AvailabilityStatus;
  available_from?: string | null;
  last_verified_at?: string | null;

  // System
  created_at: string;
  updated_at: string;
  archived_at?: string | null;

  // Joined relations
  media?: PropertyMedia[];
  assigned_profile?: Profile | null;
}

export interface PropertyMedia {
  id: string;
  organization_id: string;
  property_id: string;
  storage_path: string;
  media_type: "image" | "document" | "floor_plan";
  caption?: string | null;
  sort_order: number;
  created_at: string;
  url?: string; // Resolved or signed URL
}

export type CustomerType = "buyer" | "tenant" | "investor" | "seller" | "landlord";

export interface Customer {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  alternate_phone?: string | null;
  email?: string | null;
  customer_type: CustomerType;
  source?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;

  // Joined relations
  assigned_profile?: Profile | null;
  requirements_count?: number;
  follow_ups_count?: number;
}

export type RequirementStatus = "active" | "on_hold" | "fulfilled" | "closed";

export interface RequirementLocation {
  id: string;
  organization_id: string;
  requirement_id: string;
  city: string;
  locality?: string | null;
  sector: string;
  priority: number;
}

export interface Requirement {
  id: string;
  organization_id: string;
  customer_id: string;
  title: string;
  purpose: PropertyPurpose;
  category: PropertyCategory;
  property_type?: PropertyType | null;
  min_budget?: number | null;
  max_budget: number;
  budget_period?: RentPeriod | null;
  min_area_sqft?: number | null;
  max_area_sqft?: number | null;
  min_bhk?: number | null;
  max_bhk?: number | null;
  preferred_furnishing?: FurnishingStatus | null;
  allow_nearby_locations: boolean;
  allow_alternate_property_types: boolean;
  allow_alternate_furnishing: boolean;
  budget_flexibility_percent: number;
  status: RequirementStatus;
  assigned_to?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  customer?: Customer;
  locations?: RequirementLocation[];
}

export type MatchType = "exact" | "near";

export interface MismatchReason {
  field: "budget" | "furnishing" | "location" | "property_type" | "area" | "bhk";
  label: string;
  difference?: string;
}

export interface PropertyMatch {
  id: string;
  organization_id: string;
  requirement_id: string;
  property_id: string;
  match_type: MatchType;
  match_score: number;
  mismatch_reasons: MismatchReason[];
  calculated_at: string;

  // Joined relations
  property?: Property;
  requirement?: Requirement;
}

export type FollowUpStatus = "pending" | "completed" | "cancelled";

export interface FollowUp {
  id: string;
  organization_id: string;
  customer_id: string;
  requirement_id?: string | null;
  property_id?: string | null;
  assigned_to?: string | null;
  title: string;
  due_at: string;
  status: FollowUpStatus;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  customer?: Customer;
  property?: Property;
  requirement?: Requirement;
  assigned_profile?: Profile | null;
}

export type ActivityType =
  | "call"
  | "meeting"
  | "site_visit"
  | "note"
  | "status_change"
  | "match_sent"
  | "created";

export interface Activity {
  id: string;
  organization_id: string;
  customer_id?: string | null;
  requirement_id?: string | null;
  property_id?: string | null;
  activity_type: ActivityType;
  description: string;
  created_by?: string | null;
  created_at: string;
  created_by_profile?: Profile | null;
}

export interface PropertyFilters {
  query?: string;
  purpose?: PropertyPurpose;
  category?: PropertyCategory;
  property_type?: PropertyType;
  city?: string;
  locality?: string;
  sector?: string;
  society?: string;
  min_price?: number;
  max_price?: number;
  rent_period?: RentPeriod;
  bhk?: number;
  min_area?: number;
  max_area?: number;
  furnishing?: FurnishingStatus;
  availability?: AvailabilityStatus;
  assigned_to?: string;
  archived?: boolean;
  sort_by?: "created_at" | "price_amount" | "last_verified_at";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
