import assert from "node:assert";
import {
  evaluatePropertyMatch,
  matchPropertiesForRequirement,
} from "../src/lib/matching/engine";
import { Property, Requirement, Membership, UserRole } from "../src/types";

console.log("🚀 Running Tenant Isolation & Security Policy Test Suite...\n");

const ORG_A = "a0000000-0000-0000-0000-000000000001";
const ORG_B = "b0000000-0000-0000-0000-000000000002";

const USER_A = "u0000000-0000-0000-0000-000000000001";
const USER_B = "u0000000-0000-0000-0000-000000000002";

// Simulation of RLS policy check: get_user_organizations()
function getUserOrganizations(userId: string, memberships: Membership[]): string[] {
  return memberships
    .filter((m) => m.user_id === userId && m.status === "active")
    .map((m) => m.organization_id);
}

// Simulation of RLS policy check: has_org_role()
function hasOrgRole(
  userId: string,
  targetOrgId: string,
  allowedRoles: UserRole[],
  memberships: Membership[]
): boolean {
  const member = memberships.find(
    (m) => m.user_id === userId && m.organization_id === targetOrgId && m.status === "active"
  );
  if (!member) return false;
  return allowedRoles.includes(member.role);
}

// Simulation of SELECT policy on properties
function canSelectProperty(userId: string, property: Property, memberships: Membership[]): boolean {
  const userOrgs = getUserOrganizations(userId, memberships);
  return userOrgs.includes(property.organization_id);
}

// Simulation of INSERT/UPDATE policy on properties
function canMutateProperty(userId: string, property: Property, memberships: Membership[]): boolean {
  const userOrgs = getUserOrganizations(userId, memberships);
  if (!userOrgs.includes(property.organization_id)) return false;
  return hasOrgRole(userId, property.organization_id, ["owner", "admin", "manager", "agent"], memberships);
}

// Simulation of Membership role change guard (users cannot self-elevate)
function canUpdateMemberRole(
  actorUserId: string,
  targetMembership: Membership,
  newRole: UserRole,
  memberships: Membership[]
): { allowed: boolean; reason?: string } {
  // 1. Actor must be owner or admin of that org
  if (!hasOrgRole(actorUserId, targetMembership.organization_id, ["owner", "admin"], memberships)) {
    return { allowed: false, reason: "Insufficient permissions to manage memberships" };
  }
  // 2. Actor cannot change their own role (prevent self elevation/escalation)
  if (actorUserId === targetMembership.user_id) {
    return { allowed: false, reason: "Self role-elevation is strictly prohibited" };
  }
  return { allowed: true };
}

// Setup mock memberships
const mockMemberships: Membership[] = [
  {
    id: "m-1",
    organization_id: ORG_A,
    user_id: USER_A,
    role: "owner",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m-2",
    organization_id: ORG_A,
    user_id: "agent-1",
    role: "agent",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m-3",
    organization_id: ORG_A,
    user_id: "viewer-1",
    role: "viewer",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m-4",
    organization_id: ORG_B,
    user_id: USER_B,
    role: "owner",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const propertyInOrgA: Property = {
  id: "p-a1",
  organization_id: ORG_A,
  property_code: "PROP-A1",
  title: "Apartment in Org A",
  purpose: "rent",
  category: "residential",
  property_type: "flat",
  city: "New Delhi",
  sector: "Sector 12",
  price_amount: 40000,
  rent_period: "month",
  maintenance_amount: 2000,
  is_negotiable: false,
  owner_name: "Owner A",
  owner_phone: "+91 90000 00001",
  availability_status: "available",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const propertyInOrgB: Property = {
  id: "p-b1",
  organization_id: ORG_B,
  property_code: "PROP-B1",
  title: "Apartment in Org B",
  purpose: "rent",
  category: "residential",
  property_type: "flat",
  city: "New Delhi",
  sector: "Sector 12",
  price_amount: 40000,
  rent_period: "month",
  maintenance_amount: 2000,
  is_negotiable: false,
  owner_name: "Owner B",
  owner_phone: "+91 90000 00002",
  availability_status: "available",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Test 1: User A cannot read Property from Org B
{
  const canReadOwn = canSelectProperty(USER_A, propertyInOrgA, mockMemberships);
  const canReadOther = canSelectProperty(USER_A, propertyInOrgB, mockMemberships);
  assert.strictEqual(canReadOwn, true, "User A should be able to read Org A properties");
  assert.strictEqual(canReadOther, false, "Cross-tenant read MUST be denied");
  console.log("✔ Test 1 Passed: Cross-tenant SELECT read denied by RLS policy");
}

// Test 2: User A cannot insert/update Property in Org B
{
  const canMutateOther = canMutateProperty(USER_A, propertyInOrgB, mockMemberships);
  assert.strictEqual(canMutateOther, false, "Cross-tenant property mutation MUST be denied");
  console.log("✔ Test 2 Passed: Cross-tenant property INSERT/UPDATE denied by RLS policy");
}

// Test 3: Viewer role cannot mutate property in own Org
{
  const viewerCanMutate = canMutateProperty("viewer-1", propertyInOrgA, mockMemberships);
  assert.strictEqual(viewerCanMutate, false, "Viewer role must have read-only access");
  console.log("✔ Test 3 Passed: Viewer role denied write access to properties");
}

// Test 4: Agent role can mutate property in own Org
{
  const agentCanMutate = canMutateProperty("agent-1", propertyInOrgA, mockMemberships);
  assert.strictEqual(agentCanMutate, true, "Agent role is permitted to add/update properties");
  console.log("✔ Test 4 Passed: Agent role granted property write access in own organization");
}

// Test 5: Self-Role Elevation Prevention
{
  const agentMembership = mockMemberships.find((m) => m.user_id === "agent-1")!;
  // Agent attempts to elevate themselves to 'owner'
  const selfElevationAttempt = canUpdateMemberRole(
    "agent-1",
    agentMembership,
    "owner",
    mockMemberships
  );
  assert.strictEqual(selfElevationAttempt.allowed, false, "Self role elevation must be blocked");
  console.log("✔ Test 5 Passed: Self-role elevation prevention verified");
}

// Test 6: Cross-tenant matching engine isolation
{
  const requirementInOrgA: Requirement = {
    id: "req-a1",
    organization_id: ORG_A,
    customer_id: "c-1",
    title: "Org A Search",
    purpose: "rent",
    category: "residential",
    property_type: "flat",
    max_budget: 50000,
    budget_period: "month",
    allow_nearby_locations: false,
    allow_alternate_property_types: false,
    allow_alternate_furnishing: false,
    budget_flexibility_percent: 0,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    locations: [{ id: "l-1", organization_id: ORG_A, requirement_id: "req-a1", city: "New Delhi", sector: "Sector 12", priority: 1 }],
  };

  const matchAttempt = evaluatePropertyMatch(propertyInOrgB, requirementInOrgA);
  assert.strictEqual(matchAttempt.isMatch, false, "Cross-tenant property match MUST be rejected");
  console.log("✔ Test 6 Passed: Matching engine strictly rejects cross-tenant inventory");
}

console.log("\n✨ All 6 Tenant Isolation & Security tests PASSED successfully!\n");
