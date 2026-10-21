import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "crypto";
import { Property, Customer, Requirement, Organization } from "@/types";

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Use service role key if available (bypasses RLS), otherwise anon key
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

/**
 * Deterministically convert any ID (e.g. org-123 or prop-456) to a valid PostgreSQL UUID
 */
export function toValidUuid(input?: string): string {
  if (!input) return randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
    return input.toLowerCase();
  }
  const hash = createHash("md5").update(input).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// In-memory cache of already verified organization UUIDs to avoid blocking upserts on every navigation
const verifiedOrgUuids = new Set<string>();

/**
 * Ensure organization exists in Supabase so foreign key constraints are satisfied
 */
export async function ensureSupabaseOrg(orgId: string, orgName: string): Promise<string> {
  const orgUuid = toValidUuid(orgId);
  if (verifiedOrgUuids.has(orgUuid)) {
    return orgUuid;
  }

  const supabase = getSupabase();
  if (!supabase) return orgUuid;

  try {
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40) || "workspace";
    const { error } = await supabase.from("organizations").upsert(
      {
        id: orgUuid,
        name: orgName,
        slug: `${slug}-${orgUuid.slice(0, 6)}`,
        status: "active",
      },
      { onConflict: "id" }
    );
    if (!error) {
      verifiedOrgUuids.add(orgUuid);
    } else {
      console.warn("Notice on Supabase org upsert:", error.message);
    }
  } catch (err) {
    console.warn("Supabase organization upsert error:", err);
  }
  return orgUuid;
}

/**
 * Save property directly to Supabase PostgreSQL database
 */
export async function savePropertyToSupabase(prop: Property): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const orgUuid = await ensureSupabaseOrg(prop.organization_id, "Workspace");
    const propUuid = toValidUuid(prop.id);

    const payload = {
      id: propUuid,
      organization_id: orgUuid,
      property_code: prop.property_code,
      title: prop.title,
      description: prop.description || null,
      purpose: prop.purpose,
      category: prop.category,
      property_type: prop.property_type,
      city: prop.city,
      locality: prop.locality || null,
      sector: prop.sector,
      society_name: prop.society_name || null,
      address: prop.address || null,
      pincode: prop.pincode || null,
      latitude: prop.latitude || null,
      longitude: prop.longitude || null,
      price_amount: Number(prop.price_amount) || 0,
      rent_period: prop.rent_period || null,
      maintenance_amount: Number(prop.maintenance_amount) || 0,
      is_negotiable: Boolean(prop.is_negotiable),
      bhk: prop.bhk != null ? Number(prop.bhk) : null,
      bathrooms: prop.bathrooms != null ? Number(prop.bathrooms) : null,
      balconies: prop.balconies != null ? Number(prop.balconies) : null,
      furnishing_status: prop.furnishing_status || null,
      floor_number: prop.floor_number != null ? Number(prop.floor_number) : null,
      total_floors: prop.total_floors != null ? Number(prop.total_floors) : null,
      parking: prop.parking || null,
      carpet_area_sqft: prop.carpet_area_sqft != null ? Number(prop.carpet_area_sqft) : null,
      builtup_area_sqft: prop.builtup_area_sqft != null ? Number(prop.builtup_area_sqft) : null,
      plot_area_sqft: prop.plot_area_sqft != null ? Number(prop.plot_area_sqft) : null,
      frontage_ft: prop.frontage_ft != null ? Number(prop.frontage_ft) : null,
      permitted_use: prop.permitted_use || null,
      lease_term_months: prop.lease_term_months != null ? Number(prop.lease_term_months) : null,
      plot_width_ft: prop.plot_width_ft != null ? Number(prop.plot_width_ft) : null,
      plot_length_ft: prop.plot_length_ft != null ? Number(prop.plot_length_ft) : null,
      road_width_ft: prop.road_width_ft != null ? Number(prop.road_width_ft) : null,
      land_use: prop.land_use || null,
      owner_name: prop.owner_name,
      owner_phone: prop.owner_phone,
      source_type: prop.source_type || null,
      availability_status: prop.availability_status || "available",
      available_from: prop.available_from || null,
      last_verified_at: prop.last_verified_at || new Date().toISOString(),
      created_at: prop.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("properties").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("❌ Supabase properties table upsert failed:", error.message, `(code: ${error.code})`);
      return false;
    }

    console.log(`✅ Property ${prop.property_code} saved to Supabase properties table.`);
    return true;
  } catch (err) {
    console.error("Exception while saving property to Supabase:", err);
    return false;
  }
}

/**
 * Fetch properties from Supabase PostgreSQL database
 */
export async function fetchPropertiesFromSupabase(orgId: string): Promise<Property[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const orgUuid = toValidUuid(orgId);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch properties error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      organization_id: orgId,
      property_code: row.property_code,
      title: row.title,
      description: row.description,
      purpose: row.purpose,
      category: row.category,
      property_type: row.property_type,
      city: row.city,
      locality: row.locality,
      sector: row.sector,
      society_name: row.society_name,
      address: row.address,
      pincode: row.pincode,
      latitude: row.latitude,
      longitude: row.longitude,
      price_amount: Number(row.price_amount),
      rent_period: row.rent_period,
      maintenance_amount: Number(row.maintenance_amount || 0),
      is_negotiable: Boolean(row.is_negotiable),
      bhk: row.bhk != null ? Number(row.bhk) : undefined,
      bathrooms: row.bathrooms != null ? Number(row.bathrooms) : undefined,
      balconies: row.balconies != null ? Number(row.balconies) : undefined,
      furnishing_status: row.furnishing_status,
      floor_number: row.floor_number != null ? Number(row.floor_number) : undefined,
      total_floors: row.total_floors != null ? Number(row.total_floors) : undefined,
      parking: row.parking,
      carpet_area_sqft: row.carpet_area_sqft != null ? Number(row.carpet_area_sqft) : undefined,
      builtup_area_sqft: row.builtup_area_sqft != null ? Number(row.builtup_area_sqft) : undefined,
      plot_area_sqft: row.plot_area_sqft != null ? Number(row.plot_area_sqft) : undefined,
      frontage_ft: row.frontage_ft != null ? Number(row.frontage_ft) : undefined,
      permitted_use: row.permitted_use,
      lease_term_months: row.lease_term_months != null ? Number(row.lease_term_months) : undefined,
      plot_width_ft: row.plot_width_ft != null ? Number(row.plot_width_ft) : undefined,
      plot_length_ft: row.plot_length_ft != null ? Number(row.plot_length_ft) : undefined,
      road_width_ft: row.road_width_ft != null ? Number(row.road_width_ft) : undefined,
      land_use: row.land_use,
      owner_name: row.owner_name,
      owner_phone: row.owner_phone,
      source_type: row.source_type,
      availability_status: row.availability_status,
      available_from: row.available_from,
      last_verified_at: row.last_verified_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
      media: [],
    }));
  } catch (err) {
    console.warn("Exception fetching properties from Supabase:", err);
    return null;
  }
}

/**
 * Delete / Archive property in Supabase
 */
export async function deletePropertyFromSupabase(propId: string, orgId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const propUuid = toValidUuid(propId);
    const orgUuid = toValidUuid(orgId);

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propUuid)
      .eq("organization_id", orgUuid);

    if (error) {
      console.warn("Supabase delete property error:", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Save customer directly to Supabase PostgreSQL database
 */
export async function saveCustomerToSupabase(customer: Customer): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const orgUuid = await ensureSupabaseOrg(customer.organization_id, "Workspace");
    const custUuid = toValidUuid(customer.id);

    const payload = {
      id: custUuid,
      organization_id: orgUuid,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email || null,
      customer_type: customer.customer_type,
      notes: customer.notes || null,
      status: "active",
      created_at: customer.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("customers").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("❌ Supabase customers table upsert failed:", error.message);
      return false;
    }

    console.log(`✅ Customer ${customer.full_name} saved to Supabase customers table.`);
    return true;
  } catch (err) {
    console.error("Exception while saving customer to Supabase:", err);
    return false;
  }
}

/**
 * Fetch customers from Supabase PostgreSQL database
 */
export async function fetchCustomersFromSupabase(orgId: string): Promise<Customer[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const orgUuid = toValidUuid(orgId);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch customers error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      organization_id: orgId,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      customer_type: row.customer_type,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.warn("Exception fetching customers from Supabase:", err);
    return null;
  }
}

/**
 * Save requirement directly to Supabase PostgreSQL database
 */
export async function saveRequirementToSupabase(req: Requirement): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const orgUuid = await ensureSupabaseOrg(req.organization_id, "Workspace");
    const reqUuid = toValidUuid(req.id);
    const custUuid = toValidUuid(req.customer_id);

    // Guarantee parent customer exists
    await supabase.from("customers").upsert(
      {
        id: custUuid,
        organization_id: orgUuid,
        full_name: req.customer?.full_name || "Client",
        phone: req.customer?.phone || "0000000000",
        customer_type: "buyer",
        status: "active",
      },
      { onConflict: "id" }
    );

    const payload = {
      id: reqUuid,
      organization_id: orgUuid,
      customer_id: custUuid,
      title: req.title,
      purpose: req.purpose,
      category: req.category,
      property_type: req.property_type || null,
      min_budget: req.min_budget != null ? Number(req.min_budget) : null,
      max_budget: Number(req.max_budget) || 0,
      budget_period: req.budget_period || null,
      min_area_sqft: req.min_area_sqft != null ? Number(req.min_area_sqft) : null,
      max_area_sqft: req.max_area_sqft != null ? Number(req.max_area_sqft) : null,
      min_bhk: req.min_bhk != null ? Number(req.min_bhk) : null,
      max_bhk: req.max_bhk != null ? Number(req.max_bhk) : null,
      preferred_furnishing: req.preferred_furnishing || null,
      allow_nearby_locations: Boolean(req.allow_nearby_locations),
      allow_alternate_property_types: Boolean(req.allow_alternate_property_types),
      allow_alternate_furnishing: Boolean(req.allow_alternate_furnishing),
      budget_flexibility_percent: Number(req.budget_flexibility_percent || 0),
      status: req.status || "active",
      created_at: req.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("requirements").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("❌ Supabase requirements table upsert failed:", error.message);
      return false;
    }

    console.log(`✅ Requirement "${req.title}" saved to Supabase requirements table.`);
    return true;
  } catch (err) {
    console.error("Exception while saving requirement to Supabase:", err);
    return false;
  }
}

/**
 * Fetch requirements from Supabase PostgreSQL database
 */
export async function fetchRequirementsFromSupabase(orgId: string): Promise<Requirement[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const orgUuid = toValidUuid(orgId);
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .eq("organization_id", orgUuid)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch requirements error:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      organization_id: orgId,
      customer_id: row.customer_id,
      title: row.title,
      purpose: row.purpose,
      category: row.category,
      property_type: row.property_type,
      min_budget: row.min_budget != null ? Number(row.min_budget) : null,
      max_budget: Number(row.max_budget),
      budget_period: row.budget_period,
      min_area_sqft: row.min_area_sqft != null ? Number(row.min_area_sqft) : null,
      max_area_sqft: row.max_area_sqft != null ? Number(row.max_area_sqft) : null,
      min_bhk: row.min_bhk != null ? Number(row.min_bhk) : null,
      max_bhk: row.max_bhk != null ? Number(row.max_bhk) : null,
      preferred_furnishing: row.preferred_furnishing,
      allow_nearby_locations: Boolean(row.allow_nearby_locations),
      allow_alternate_property_types: Boolean(row.allow_alternate_property_types),
      allow_alternate_furnishing: Boolean(row.allow_alternate_furnishing),
      budget_flexibility_percent: Number(row.budget_flexibility_percent || 0),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      locations: [],
    }));
  } catch (err) {
    console.warn("Exception fetching requirements from Supabase:", err);
    return null;
  }
}
