import {
  Organization,
  Property,
  Customer,
  Requirement,
  FollowUp,
  Activity,
  Membership,
  PropertyFilters,
  UserRole,
} from "@/types";
import {
  savePropertyToSupabase,
  fetchPropertiesFromSupabase,
  deletePropertyFromSupabase,
  saveCustomerToSupabase,
  fetchCustomersFromSupabase,
  saveRequirementToSupabase,
  fetchRequirementsFromSupabase,
  ensureSupabaseOrg,
  getSupabase,
  toValidUuid,
} from "./supabase-db";

export interface RegisteredAccount {
  email: string;
  passwordHash?: string;
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  role: UserRole;
}

function getDbFilePath(): string {
  const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
  const path = getPath();
  if (path) {
    if (isServerless) {
      return path.join("/tmp", ".data", "db.json");
    }
    return path.join(process.cwd(), ".data", "db.json");
  }
  return isServerless ? "/tmp/.data/db.json" : "./.data/db.json";
}

function getFs() {
  if (typeof window === "undefined") {
    try {
      return require("node:fs");
    } catch {
      return null;
    }
  }
  return null;
}

function getPath() {
  if (typeof window === "undefined") {
    try {
      return require("node:path");
    } catch {
      return null;
    }
  }
  return null;
}

// In-memory multi-tenant store partitioned strictly by organization_id
class MemoryStore {
  organizations: Map<string, Organization> = new Map();
  accounts: Map<string, RegisteredAccount> = new Map();
  memberships: Membership[] = [];
  properties: Property[] = [];
  customers: Customer[] = [];
  requirements: Requirement[] = [];
  followUps: FollowUp[] = [];
  activities: Activity[] = [];
}

function ensureStore(s: MemoryStore): MemoryStore {
  if (!s.organizations || typeof s.organizations.has !== "function") {
    s.organizations = new Map();
  }
  if (!s.accounts || typeof s.accounts.has !== "function") {
    s.accounts = new Map();
  }
  if (!Array.isArray(s.memberships)) s.memberships = [];
  if (!Array.isArray(s.properties)) s.properties = [];
  if (!Array.isArray(s.customers)) s.customers = [];
  if (!Array.isArray(s.requirements)) s.requirements = [];
  if (!Array.isArray(s.followUps)) s.followUps = [];
  if (!Array.isArray(s.activities)) s.activities = [];
  return s;
}

function loadFromDisk(s: MemoryStore) {
  const fs = getFs();
  if (!fs) return;
  try {
    const filePath = getDbFilePath();
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf-8");
      const data = JSON.parse(raw);
      if (data) {
        if (Array.isArray(data.properties) && data.properties.length > 0) {
          s.properties = data.properties;
        }
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          s.customers = data.customers;
        }
        if (Array.isArray(data.requirements) && data.requirements.length > 0) {
          s.requirements = data.requirements;
        }
        if (Array.isArray(data.followUps) && data.followUps.length > 0) {
          s.followUps = data.followUps;
        }
        if (Array.isArray(data.activities) && data.activities.length > 0) {
          s.activities = data.activities;
        }
        if (Array.isArray(data.organizations)) {
          for (const org of data.organizations) {
            s.organizations.set(org.id, org);
          }
        }
        if (Array.isArray(data.accounts)) {
          for (const acc of data.accounts) {
            s.accounts.set(acc.email, acc);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Notice: could not load store from disk:", err);
  }
}

function saveToDisk(s: MemoryStore) {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) return;
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {
      properties: s.properties,
      customers: s.customers,
      requirements: s.requirements,
      followUps: s.followUps,
      activities: s.activities,
      organizations: Array.from(s.organizations.values()),
      accounts: Array.from(s.accounts.values()),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: could not save store to disk:", err);
  }
}

// Global singleton across server invocations in development
const globalForStore = globalThis as unknown as { appStore?: MemoryStore };
const store = ensureStore(globalForStore.appStore ?? new MemoryStore());
loadFromDisk(store);
if (process.env.NODE_ENV !== "production") globalForStore.appStore = store;

let activeWorkspaceId = "org-active";
let activeWorkspaceName = "My Real Estate Workspace";
let activeWorkspaceUserName = "Broker";
let activeWorkspaceRole: UserRole = "owner";

export function setActiveWorkspace(
  orgId: string,
  orgName: string,
  userName?: string,
  userRole?: UserRole
) {
  ensureStore(store);
  if (orgId) activeWorkspaceId = orgId;
  if (orgName) activeWorkspaceName = orgName;
  if (userName) activeWorkspaceUserName = userName;
  if (userRole) activeWorkspaceRole = userRole;

  if (store.organizations && !store.organizations.has(activeWorkspaceId)) {
    store.organizations.set(activeWorkspaceId, {
      id: activeWorkspaceId,
      name: activeWorkspaceName,
      slug: activeWorkspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    saveToDisk(store);
  }

  ensureSupabaseOrg(activeWorkspaceId, activeWorkspaceName).catch(() => {});
}

async function getServerSessionSafe(): Promise<{
  organizationId?: string;
  organizationName?: string;
  name?: string;
  role?: UserRole;
  id?: string;
} | null> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = require("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("realcrm_session")?.value;
      if (!token) return null;
      const raw = Buffer.from(token, "base64url").toString("utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.organizationId || parsed.email)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Resolve the current active organization ID
 */
async function resolveCurrentOrgId(explicitOrgId?: string): Promise<{
  orgId: string;
  orgName: string;
  userId: string;
  userName: string;
  userRole: UserRole;
}> {
  if (explicitOrgId && explicitOrgId !== "demo-org" && explicitOrgId !== "default-org") {
    const existingOrg = store.organizations.get(explicitOrgId);
    return {
      orgId: explicitOrgId,
      orgName: existingOrg?.name || activeWorkspaceName,
      userId: "usr-admin",
      userName: activeWorkspaceUserName,
      userRole: activeWorkspaceRole,
    };
  }

  // 1. Try reading active session cookie
  const session = await getServerSessionSafe();
  if (session?.organizationId) {
    return {
      orgId: session.organizationId,
      orgName: session.organizationName || activeWorkspaceName,
      userId: session.id || "usr-active",
      userName: session.name || activeWorkspaceUserName,
      userRole: session.role || activeWorkspaceRole,
    };
  }

  // 2. If runtime activeWorkspaceId was set and isn't generic fallback
  if (activeWorkspaceId && activeWorkspaceId !== "org-active") {
    return {
      orgId: activeWorkspaceId,
      orgName: activeWorkspaceName,
      userId: "usr-active",
      userName: activeWorkspaceUserName,
      userRole: activeWorkspaceRole,
    };
  }

  return {
    orgId: activeWorkspaceId,
    orgName: activeWorkspaceName,
    userId: "usr-active",
    userName: activeWorkspaceUserName,
    userRole: activeWorkspaceRole,
  };
}

export async function getAccountByEmail(email: string): Promise<RegisteredAccount | null> {
  const normalized = email.toLowerCase().trim();
  const acc = store.accounts.get(normalized);
  return acc ? { ...acc } : null;
}

export async function saveAccount(account: RegisteredAccount): Promise<void> {
  const normalized = account.email.toLowerCase().trim();
  store.accounts.set(normalized, account);

  // Guarantee organization is in store
  if (!store.organizations.has(account.organizationId)) {
    store.organizations.set(account.organizationId, {
      id: account.organizationId,
      name: account.organizationName,
      slug: account.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Guarantee membership is in store
  const existingMem = store.memberships.find(
    (m) => m.organization_id === account.organizationId && m.user_id === account.userId
  );
  if (!existingMem) {
    store.memberships.push({
      id: `mem-${account.userId}`,
      organization_id: account.organizationId,
      user_id: account.userId,
      role: account.role,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        user_id: account.userId,
        full_name: account.userName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  saveToDisk(store);
  ensureSupabaseOrg(account.organizationId, account.organizationName).catch(() => {});
}

// ============================================================================
// ORGANIZATIONS & MEMBERSHIPS
// ============================================================================
export async function registerOrganization(data: {
  id: string;
  name: string;
  email: string;
  ownerName: string;
}): Promise<Organization> {
  const org: Organization = {
    id: data.id,
    name: data.name,
    slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).slice(2, 6),
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.organizations.set(org.id, org);

  // Add owner membership
  const membership: Membership = {
    id: `mem-${Date.now()}`,
    organization_id: org.id,
    user_id: `user-${Date.now()}`,
    role: "owner",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      user_id: `user-${Date.now()}`,
      full_name: data.ownerName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  store.memberships.push(membership);
  return org;
}

export async function getActiveOrganization(): Promise<Organization> {
  const { orgId, orgName } = await resolveCurrentOrgId();
  const existing = store.organizations.get(orgId);
  if (existing) return existing;

  const created: Organization = {
    id: orgId,
    name: orgName,
    slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.organizations.set(orgId, created);
  return created;
}

export async function getTeamMembers(): Promise<Membership[]> {
  const { orgId, userId, userName, userRole } = await resolveCurrentOrgId();
  const members = store.memberships.filter((m) => m.organization_id === orgId);

  if (members.length === 0) {
    return [
      {
        id: `mem-${userId}`,
        organization_id: orgId,
        user_id: userId,
        role: userRole,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          user_id: userId,
          full_name: userName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];
  }

  return members;
}

export async function updateMemberRole(
  memberId: string,
  newRole: UserRole
): Promise<Membership | null> {
  const member = store.memberships.find((m) => m.id === memberId);
  if (!member) return null;
  member.role = newRole;
  member.updated_at = new Date().toISOString();
  return member;
}

// ============================================================================
// PROPERTIES (Strict Tenant Isolation)
// ============================================================================
export async function getProperties(filters: PropertyFilters = {}): Promise<{
  properties: Property[];
  total: number;
}> {
  const { orgId } = await resolveCurrentOrgId();

  // Sync latest from Supabase if configured
  try {
    const remote = await fetchPropertiesFromSupabase(orgId);
    if (remote && remote.length > 0) {
      for (const r of remote) {
        const idx = store.properties.findIndex((p) => p.id === r.id);
        if (idx === -1) {
          store.properties.push(r);
        } else {
          store.properties[idx] = { ...store.properties[idx], ...r };
        }
      }
      saveToDisk(store);
    }
  } catch {}

  let list = store.properties.filter((p) => {
    // Strict organization boundary
    if (p.organization_id !== orgId) return false;

    // Soft delete check
    if (filters.archived) {
      if (!p.archived_at) return false;
    } else {
      if (p.archived_at) return false;
    }

    // Purpose
    if (filters.purpose && p.purpose !== filters.purpose) return false;

    // Category
    if (filters.category && p.category !== filters.category) return false;

    // Property Type
    if (filters.property_type && p.property_type !== filters.property_type) return false;

    // City
    if (filters.city && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;

    // Sector
    if (filters.sector && !p.sector.toLowerCase().includes(filters.sector.toLowerCase()))
      return false;

    // Society
    if (
      filters.society &&
      (!p.society_name || !p.society_name.toLowerCase().includes(filters.society.toLowerCase()))
    )
      return false;

    // Availability
    if (filters.availability && p.availability_status !== filters.availability) return false;

    // Price range
    if (filters.min_price != null && p.price_amount < filters.min_price) return false;
    if (filters.max_price != null && p.price_amount > filters.max_price) return false;

    // Rent period
    if (filters.rent_period && p.rent_period !== filters.rent_period) return false;

    // BHK
    if (filters.bhk != null && p.bhk !== filters.bhk) return false;

    // Furnishing
    if (filters.furnishing && p.furnishing_status !== filters.furnishing) return false;

    // General text query
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const match =
        p.property_code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.society_name && p.society_name.toLowerCase().includes(q)) ||
        p.owner_name.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sorting
  const sortBy = filters.sort_by || "created_at";
  const sortOrder = filters.sort_order || "desc";

  list.sort((a, b) => {
    let comp = 0;
    if (sortBy === "price_amount") {
      comp = a.price_amount - b.price_amount;
    } else if (sortBy === "last_verified_at") {
      comp = new Date(a.last_verified_at || 0).getTime() - new Date(b.last_verified_at || 0).getTime();
    } else {
      comp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortOrder === "desc" ? -comp : comp;
  });

  const total = list.length;
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const paginated = list.slice((page - 1) * limit, page * limit);

  return { properties: paginated, total };
}

export async function getPropertyById(id: string): Promise<Property | null> {
  loadFromDisk(store);
  const { orgId } = await resolveCurrentOrgId();

  // 1. Strict tenant boundary: match by ID AND active organization_id
  let prop = store.properties.find((p) => p.id === id && p.organization_id === orgId);

  // 2. Fallback: check Supabase directly with the exact organization_id
  if (!prop) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const propUuid = toValidUuid(id);
        const orgUuid = toValidUuid(orgId);
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propUuid)
          .eq("organization_id", orgUuid)
          .maybeSingle();

        if (data && !error) {
          prop = {
            id: data.id,
            organization_id: data.organization_id,
            property_code: data.property_code,
            title: data.title,
            description: data.description,
            purpose: data.purpose,
            category: data.category,
            property_type: data.property_type,
            city: data.city,
            locality: data.locality,
            sector: data.sector,
            society_name: data.society_name,
            address: data.address,
            pincode: data.pincode,
            latitude: data.latitude,
            longitude: data.longitude,
            price_amount: Number(data.price_amount),
            rent_period: data.rent_period,
            maintenance_amount: Number(data.maintenance_amount || 0),
            is_negotiable: Boolean(data.is_negotiable),
            bhk: data.bhk != null ? Number(data.bhk) : undefined,
            bathrooms: data.bathrooms != null ? Number(data.bathrooms) : undefined,
            balconies: data.balconies != null ? Number(data.balconies) : undefined,
            furnishing_status: data.furnishing_status,
            floor_number: data.floor_number != null ? Number(data.floor_number) : undefined,
            total_floors: data.total_floors != null ? Number(data.total_floors) : undefined,
            parking: data.parking,
            carpet_area_sqft: data.carpet_area_sqft != null ? Number(data.carpet_area_sqft) : undefined,
            builtup_area_sqft: data.builtup_area_sqft != null ? Number(data.builtup_area_sqft) : undefined,
            plot_area_sqft: data.plot_area_sqft != null ? Number(data.plot_area_sqft) : undefined,
            frontage_ft: data.frontage_ft != null ? Number(data.frontage_ft) : undefined,
            permitted_use: data.permitted_use,
            lease_term_months: data.lease_term_months != null ? Number(data.lease_term_months) : undefined,
            plot_width_ft: data.plot_width_ft != null ? Number(data.plot_width_ft) : undefined,
            plot_length_ft: data.plot_length_ft != null ? Number(data.plot_length_ft) : undefined,
            road_width_ft: data.road_width_ft != null ? Number(data.road_width_ft) : undefined,
            land_use: data.land_use,
            owner_name: data.owner_name,
            owner_phone: data.owner_phone,
            source_type: data.source_type,
            availability_status: data.availability_status,
            available_from: data.available_from,
            last_verified_at: data.last_verified_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
            archived_at: data.archived_at,
            media: [],
          };
          store.properties.push(prop);
          saveToDisk(store);
        }
      } catch (err) {
        console.warn("Notice: getPropertyById Supabase fallback error:", err);
      }
    }
  }

  return prop ? { ...prop } : null;
}

export async function checkDuplicateProperty(
  code: string,
  sector: string,
  society?: string | null,
  excludeId?: string
): Promise<{ isDuplicate: boolean; reason?: string; matchProperty?: Property }> {
  const { orgId } = await resolveCurrentOrgId();

  // Check exact code match within organization
  const codeMatch = store.properties.find(
    (p) =>
      p.organization_id === orgId &&
      p.id !== excludeId &&
      p.property_code.toLowerCase().trim() === code.toLowerCase().trim()
  );
  if (codeMatch) {
    return {
      isDuplicate: true,
      reason: `A property with code "${code}" already exists in your workspace (${codeMatch.title})`,
      matchProperty: codeMatch,
    };
  }

  // Check possible duplicate in same society & sector
  if (society && society.trim()) {
    const locMatch = store.properties.find(
      (p) =>
        p.organization_id === orgId &&
        p.id !== excludeId &&
        !p.archived_at &&
        p.sector.toLowerCase().trim() === sector.toLowerCase().trim() &&
        p.society_name &&
        p.society_name.toLowerCase().trim() === society.toLowerCase().trim()
    );
    if (locMatch) {
      return {
        isDuplicate: true,
        reason: `Potential duplicate in same society "${society}": ${locMatch.property_code} (${locMatch.title})`,
        matchProperty: locMatch,
      };
    }
  }

  return { isDuplicate: false };
}

export async function createProperty(data: Omit<Property, "id" | "created_at" | "updated_at">): Promise<Property> {
  const { orgId } = await resolveCurrentOrgId(data.organization_id);

  const newProp: Property = {
    ...data,
    id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
    media: data.media || [],
  };

  store.properties.unshift(newProp);
  saveToDisk(store);

  // Sync to Supabase
  try {
    await savePropertyToSupabase(newProp);
  } catch (err) {
    console.warn("Notice: could not save property to Supabase:", err);
  }

  await addActivity({
    organization_id: newProp.organization_id,
    property_id: newProp.id,
    activity_type: "created",
    description: `Property ${newProp.property_code} (${newProp.title}) added to inventory.`,
  });

  return newProp;
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
  const { orgId } = await resolveCurrentOrgId();
  const index = store.properties.findIndex((p) => p.id === id && p.organization_id === orgId);
  if (index === -1) return null;

  const current = store.properties[index];
  const updated: Property = {
    ...current,
    ...data,
    id,
    organization_id: orgId,
    updated_at: new Date().toISOString(),
  };

  store.properties[index] = updated;
  saveToDisk(store);

  try {
    await savePropertyToSupabase(updated);
  } catch (err) {
    console.warn("Notice: could not update property in Supabase:", err);
  }

  await addActivity({
    organization_id: orgId,
    property_id: id,
    activity_type: "status_change",
    description: `Property ${updated.property_code} details updated.`,
  });

  return updated;
}

export async function archiveProperty(id: string): Promise<boolean> {
  const { orgId } = await resolveCurrentOrgId();
  const prop = store.properties.find((p) => p.id === id && p.organization_id === orgId);
  if (!prop) return false;

  prop.archived_at = new Date().toISOString();
  prop.updated_at = new Date().toISOString();
  saveToDisk(store);

  try {
    await savePropertyToSupabase(prop);
  } catch {}

  await addActivity({
    organization_id: orgId,
    property_id: id,
    activity_type: "status_change",
    description: `Property ${prop.property_code} archived.`,
  });

  return true;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const { orgId } = await resolveCurrentOrgId();
  const index = store.properties.findIndex((p) => p.id === id && p.organization_id === orgId);
  if (index === -1) return false;

  store.properties.splice(index, 1);
  saveToDisk(store);

  try {
    await deletePropertyFromSupabase(id, orgId);
  } catch {}

  return true;
}

// ============================================================================
// CUSTOMERS (Tenant Isolated)
// ============================================================================
export async function getCustomers(): Promise<Customer[]> {
  const { orgId } = await resolveCurrentOrgId();

  try {
    const remote = await fetchCustomersFromSupabase(orgId);
    if (remote && remote.length > 0) {
      for (const r of remote) {
        const idx = store.customers.findIndex((c) => c.id === r.id);
        if (idx === -1) {
          store.customers.push(r);
        } else {
          store.customers[idx] = { ...store.customers[idx], ...r };
        }
      }
      saveToDisk(store);
    }
  } catch {}

  const activeCustomers = store.customers.filter((c) => c.organization_id === orgId && !c.archived_at);

  return activeCustomers.map((c) => {
    const reqs = store.requirements.filter((r) => r.customer_id === c.id && r.organization_id === orgId);
    const follows = store.followUps.filter((f) => f.customer_id === c.id && f.organization_id === orgId && f.status === "pending");
    return {
      ...c,
      requirements_count: reqs.length,
      follow_ups_count: follows.length,
    };
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  loadFromDisk(store);
  const { orgId } = await resolveCurrentOrgId();
  const c = store.customers.find((cust) => cust.id === id && cust.organization_id === orgId);
  if (!c) return null;

  const reqs = store.requirements.filter((r) => r.customer_id === c.id && r.organization_id === orgId);
  const follows = store.followUps.filter((f) => f.customer_id === c.id && f.organization_id === orgId);
  return {
    ...c,
    requirements_count: reqs.length,
    follow_ups_count: follows.length,
  };
}

export async function createCustomer(data: Omit<Customer, "id" | "created_at" | "updated_at">): Promise<Customer> {
  const { orgId } = await resolveCurrentOrgId(data.organization_id);

  const newCust: Customer = {
    ...data,
    id: (data as { id?: string }).id || `cust-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.customers.unshift(newCust);
  saveToDisk(store);

  try {
    await saveCustomerToSupabase(newCust);
  } catch (err) {
    console.warn("Notice: could not save customer to Supabase:", err);
  }

  await addActivity({
    organization_id: newCust.organization_id,
    customer_id: newCust.id,
    activity_type: "created",
    description: `Client ${newCust.full_name} (${newCust.customer_type}) created.`,
  });

  return newCust;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  const { orgId } = await resolveCurrentOrgId();
  const index = store.customers.findIndex((c) => c.id === id && c.organization_id === orgId);
  if (index === -1) return null;

  store.customers[index] = {
    ...store.customers[index],
    ...data,
    updated_at: new Date().toISOString(),
  };

  saveToDisk(store);

  try {
    await saveCustomerToSupabase(store.customers[index]);
  } catch {}

  return store.customers[index];
}

// ============================================================================
// REQUIREMENTS (Tenant Isolated)
// ============================================================================
export async function getRequirements(customerId?: string): Promise<Requirement[]> {
  const { orgId } = await resolveCurrentOrgId();

  try {
    const remote = await fetchRequirementsFromSupabase(orgId);
    if (remote && remote.length > 0) {
      for (const r of remote) {
        const idx = store.requirements.findIndex((req) => req.id === r.id);
        if (idx === -1) {
          store.requirements.push(r);
        } else {
          store.requirements[idx] = { ...store.requirements[idx], ...r };
        }
      }
      saveToDisk(store);
    }
  } catch {}

  let list = store.requirements.filter((r) => r.organization_id === orgId);
  if (customerId) {
    list = list.filter((r) => r.customer_id === customerId);
  }

  return list.map((r) => ({
    ...r,
    customer: store.customers.find((c) => c.id === r.customer_id && c.organization_id === orgId),
  }));
}

export async function getRequirementById(id: string): Promise<Requirement | null> {
  loadFromDisk(store);
  const { orgId } = await resolveCurrentOrgId();
  const req = store.requirements.find((r) => r.id === id && r.organization_id === orgId);
  if (!req) return null;

  return {
    ...req,
    customer: store.customers.find((c) => c.id === req.customer_id && c.organization_id === orgId),
  };
}

export async function createRequirement(data: Omit<Requirement, "id" | "created_at" | "updated_at">): Promise<Requirement> {
  const { orgId } = await resolveCurrentOrgId(data.organization_id);

  const newReq: Requirement = {
    ...data,
    id: (data as { id?: string }).id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    locations: data.locations || [],
  };

  store.requirements.unshift(newReq);
  saveToDisk(store);

  try {
    await saveRequirementToSupabase(newReq);
  } catch (err) {
    console.warn("Notice: could not save requirement to Supabase:", err);
  }

  await addActivity({
    organization_id: newReq.organization_id,
    customer_id: newReq.customer_id,
    requirement_id: newReq.id,
    activity_type: "created",
    description: `Requirement "${newReq.title}" logged.`,
  });

  return newReq;
}

// ============================================================================
// FOLLOW-UPS & ACTIVITIES
// ============================================================================
export async function getFollowUps(status?: string, customerId?: string): Promise<FollowUp[]> {
  const { orgId } = await resolveCurrentOrgId();

  let list = store.followUps.filter((f) => f.organization_id === orgId);
  if (status) {
    list = list.filter((f) => f.status === status);
  }
  if (customerId) {
    list = list.filter((f) => f.customer_id === customerId);
  }

  list.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  return list.map((f) => ({
    ...f,
    customer: store.customers.find((c) => c.id === f.customer_id && c.organization_id === orgId),
    property: f.property_id
      ? store.properties.find((p) => p.id === f.property_id && p.organization_id === orgId)
      : undefined,
    requirement: f.requirement_id
      ? store.requirements.find((r) => r.id === f.requirement_id && r.organization_id === orgId)
      : undefined,
  }));
}

export async function createFollowUp(data: Omit<FollowUp, "id" | "created_at" | "updated_at">): Promise<FollowUp> {
  const { orgId } = await resolveCurrentOrgId(data.organization_id);

  const newFollow: FollowUp = {
    ...data,
    id: `fol-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.followUps.unshift(newFollow);
  saveToDisk(store);
  return newFollow;
}

export async function toggleFollowUpStatus(
  id: string,
  newStatus: "pending" | "completed" | "cancelled"
): Promise<FollowUp | null> {
  const { orgId } = await resolveCurrentOrgId();
  const follow = store.followUps.find((f) => f.id === id && f.organization_id === orgId);
  if (!follow) return null;
  follow.status = newStatus;
  follow.updated_at = new Date().toISOString();
  saveToDisk(store);
  return follow;
}

export async function getActivities(target: {
  customerId?: string;
  propertyId?: string;
  requirementId?: string;
}): Promise<Activity[]> {
  const { orgId } = await resolveCurrentOrgId();
  return store.activities
    .filter((a) => {
      if (a.organization_id !== orgId) return false;
      if (target.customerId && a.customer_id === target.customerId) return true;
      if (target.propertyId && a.property_id === target.propertyId) return true;
      if (target.requirementId && a.requirement_id === target.requirementId) return true;
      return false;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addActivity(data: Omit<Activity, "id" | "created_at">): Promise<Activity> {
  const { orgId } = await resolveCurrentOrgId(data.organization_id);
  const newAct: Activity = {
    ...data,
    organization_id: orgId,
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  store.activities.unshift(newAct);
  saveToDisk(store);
  return newAct;
}

// ============================================================================
// DASHBOARD METRICS (Real computed database metrics for active organization)
// ============================================================================
export async function getDashboardMetrics() {
  const { orgId } = await resolveCurrentOrgId();

  const activeProperties = store.properties.filter((p) => p.organization_id === orgId && !p.archived_at);
  const total = activeProperties.length;
  const available = activeProperties.filter((p) => p.availability_status === "available").length;
  const rental = activeProperties.filter((p) => p.purpose === "rent" || p.purpose === "lease").length;
  const sale = activeProperties.filter((p) => p.purpose === "sale").length;
  const residential = activeProperties.filter((p) => p.category === "residential").length;
  const commercial = activeProperties.filter((p) => p.category === "commercial").length;
  const land = activeProperties.filter((p) => p.category === "land").length;

  const activeCustomers = store.customers.filter((c) => c.organization_id === orgId && !c.archived_at).length;
  const activeRequirements = store.requirements.filter((r) => r.organization_id === orgId && r.status === "active").length;
  const pendingFollowUps = store.followUps.filter((f) => f.organization_id === orgId && f.status === "pending").length;

  // Breakdown by sector
  const sectorCountMap: Record<string, number> = {};
  for (const p of activeProperties) {
    const sec = p.sector.trim();
    sectorCountMap[sec] = (sectorCountMap[sec] || 0) + 1;
  }
  const sectorBreakdown = Object.entries(sectorCountMap)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Recently added properties
  const recentProperties = [...activeProperties]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Upcoming follow-ups
  const upcomingFollowUps = store.followUps
    .filter((f) => f.organization_id === orgId && f.status === "pending")
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5)
    .map((f) => ({
      ...f,
      customer: store.customers.find((c) => c.id === f.customer_id && c.organization_id === orgId),
      property: f.property_id
        ? store.properties.find((p) => p.id === f.property_id && p.organization_id === orgId)
        : undefined,
    }));

  return {
    totalProperties: total,
    availableProperties: available,
    rentalProperties: rental,
    saleProperties: sale,
    residentialProperties: residential,
    commercialProperties: commercial,
    landProperties: land,
    activeCustomers,
    activeRequirements,
    pendingFollowUps,
    sectorBreakdown,
    recentProperties,
    upcomingFollowUps,
  };
}
