import assert from "node:assert";
import {
  createProperty,
  getProperties,
  getPropertyById,
  checkDuplicateProperty,
  createCustomer,
  getCustomers,
  getCustomerById,
  createRequirement,
  getRequirements,
  getRequirementById,
  getDashboardMetrics,
  setActiveWorkspace,
} from "../src/lib/data/store";
import { evaluatePropertyMatch } from "../src/lib/matching/engine";

console.log("🚀 Running Multi-Organization Isolation & Tenant Partitioning Test Suite...\n");

const runId = Date.now();
const ORG_A_ID = `org-aaa-${runId}`;
const ORG_A_NAME = `Skyline Realty Group ${runId}`;

const ORG_B_ID = `org-bbb-${runId}`;
const ORG_B_NAME = `Apex Premier Homes ${runId}`;

async function runMultiOrgTests() {
  // =========================================================================
  // TEST 1: Provision Organizations & Create Properties
  // =========================================================================
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");

  const propA1 = await createProperty({
    property_code: "PROP-SKY-01",
    title: "Skyline Luxury Penthouse",
    purpose: "sale",
    category: "residential",
    property_type: "flat",
    city: "Gurugram",
    sector: "Sector 54",
    price_amount: 35000000,
    is_negotiable: false,
    owner_name: "Harish Gupta",
    owner_phone: "+919876543210",
    availability_status: "available",
    organization_id: ORG_A_ID,
  });

  const propA2 = await createProperty({
    property_code: "PROP-SKY-02",
    title: "Skyline Studio Suite",
    purpose: "rent",
    category: "residential",
    property_type: "flat",
    city: "Gurugram",
    sector: "Sector 42",
    price_amount: 45000,
    rent_period: "month",
    is_negotiable: false,
    owner_name: "Deepak Verma",
    owner_phone: "+919876543211",
    availability_status: "available",
    organization_id: ORG_A_ID,
  });

  // Switch context to Client B (Apex Premier Homes)
  setActiveWorkspace(ORG_B_ID, ORG_B_NAME, "Agent Bob", "owner");

  const propB1 = await createProperty({
    property_code: "PROP-APX-01",
    title: "Apex Executive Villa",
    purpose: "sale",
    category: "residential",
    property_type: "villa",
    city: "Gurugram",
    sector: "Sector 54",
    price_amount: 50000000,
    is_negotiable: false,
    owner_name: "Manish Chawla",
    owner_phone: "+919876543212",
    availability_status: "available",
    organization_id: ORG_B_ID,
  });

  // =========================================================================
  // TEST 2: Inventory Isolation (List Views)
  // =========================================================================
  // Check Client B inventory
  const clientBProperties = await getProperties();
  assert.strictEqual(
    clientBProperties.properties.some((p) => p.organization_id === ORG_A_ID),
    false,
    "Client B must NEVER receive Client A's properties in inventory list"
  );
  assert.strictEqual(
    clientBProperties.properties.some((p) => p.id === propB1.id),
    true,
    "Client B must see their own property"
  );
  console.log("✔ Test 1 Passed: Client B cannot see Client A's inventory");

  // Check Client A inventory
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");
  const clientAProperties = await getProperties();
  assert.strictEqual(
    clientAProperties.properties.some((p) => p.organization_id === ORG_B_ID),
    false,
    "Client A must NEVER receive Client B's properties in inventory list"
  );
  assert.strictEqual(
    clientAProperties.properties.some((p) => p.id === propA1.id),
    true,
    "Client A must see propA1"
  );
  assert.strictEqual(
    clientAProperties.properties.some((p) => p.id === propA2.id),
    true,
    "Client A must see propA2"
  );
  console.log("✔ Test 2 Passed: Client A cannot see Client B's inventory");

  // =========================================================================
  // TEST 3: Direct Property Lookup Isolation (Prevent ID Guessing / Direct URL Access)
  // =========================================================================
  // Client A tries to access Client B's property directly by ID
  const directAccessAttemptByA = await getPropertyById(propB1.id);
  assert.strictEqual(
    directAccessAttemptByA,
    null,
    "Client A must be denied access to Client B's property ID (must return null/404)"
  );

  // Client B tries to access Client A's property directly by ID
  setActiveWorkspace(ORG_B_ID, ORG_B_NAME, "Agent Bob", "owner");
  const directAccessAttemptByB = await getPropertyById(propA1.id);
  assert.strictEqual(
    directAccessAttemptByB,
    null,
    "Client B must be denied access to Client A's property ID (must return null/404)"
  );
  console.log("✔ Test 3 Passed: Direct ID URL access across organizations returns 404 (strictly denied)");

  // =========================================================================
  // TEST 4: Customer Data Isolation
  // =========================================================================
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");
  const custA = await createCustomer({
    full_name: "Karan Johar",
    phone: "+919999911111",
    customer_type: "buyer",
    organization_id: ORG_A_ID,
  });

  setActiveWorkspace(ORG_B_ID, ORG_B_NAME, "Agent Bob", "owner");
  const custB = await createCustomer({
    full_name: "Rohit Shetty",
    phone: "+919999922222",
    customer_type: "investor",
    organization_id: ORG_B_ID,
  });

  // Client B should not see Client A's customer
  const clientBCustomers = await getCustomers();
  assert.strictEqual(
    clientBCustomers.some((c) => c.id === custA.id),
    false,
    "Client B must NOT see Client A's customer in customer list"
  );
  const custAccessAttempt = await getCustomerById(custA.id);
  assert.strictEqual(
    custAccessAttempt,
    null,
    "Client B must NOT be able to view Client A's customer detail by ID"
  );
  console.log("✔ Test 4 Passed: Customer profiles and contact data strictly isolated per client");

  // =========================================================================
  // TEST 5: Requirement Data Isolation
  // =========================================================================
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");
  const reqA = await createRequirement({
    customer_id: custA.id,
    title: "Looking for Luxury Penthouse in Sector 54",
    purpose: "sale",
    category: "residential",
    property_type: "flat",
    min_budget: 30000000,
    max_budget: 40000000,
    status: "active",
    allow_nearby_locations: false,
    allow_alternate_property_types: false,
    allow_alternate_furnishing: false,
    budget_flexibility_percent: 0,
    organization_id: ORG_A_ID,
  });

  setActiveWorkspace(ORG_B_ID, ORG_B_NAME, "Agent Bob", "owner");
  const clientBRequirements = await getRequirements();
  assert.strictEqual(
    clientBRequirements.some((r) => r.id === reqA.id),
    false,
    "Client B must NOT see Client A's requirements"
  );
  const reqAccessAttempt = await getRequirementById(reqA.id);
  assert.strictEqual(
    reqAccessAttempt,
    null,
    "Client B must NOT be able to fetch Client A's requirement by ID"
  );
  console.log("✔ Test 5 Passed: Requirements isolated per organization");

  // =========================================================================
  // TEST 6: Smart Matching Engine Multi-Tenant Isolation
  // =========================================================================
  // propA1 in Org A perfectly matches reqA in Org A
  const matchInSameOrg = evaluatePropertyMatch(propA1, reqA);
  assert.strictEqual(
    matchInSameOrg.isMatch,
    true,
    "Properties within the SAME organization should match when criteria align"
  );

  // Even if propB1 from Org B has compatible parameters, matching engine must reject it!
  const crossOrgMatch = evaluatePropertyMatch(propB1, reqA);
  assert.strictEqual(
    crossOrgMatch.isMatch,
    false,
    "Matching engine MUST reject cross-organization matches"
  );
  assert.strictEqual(
    crossOrgMatch.matchScore,
    0,
    "Cross-organization match score must be exactly 0"
  );
  console.log("✔ Test 6 Passed: Smart Matching strictly rejects cross-organization inventory");

  // =========================================================================
  // TEST 7: Independent Property Code Namespaces
  // =========================================================================
  // Client A creates 'PROP-100'
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");
  await createProperty({
    property_code: "PROP-100",
    title: "Org A Property 100",
    purpose: "sale",
    category: "residential",
    property_type: "flat",
    city: "Gurugram",
    sector: "Sector 1",
    price_amount: 10000000,
    is_negotiable: false,
    owner_name: "Owner 1",
    owner_phone: "+919876543201",
    availability_status: "available",
    organization_id: ORG_A_ID,
  });

  // Client B can also create 'PROP-100' without collision because each client has their own namespace!
  setActiveWorkspace(ORG_B_ID, ORG_B_NAME, "Agent Bob", "owner");
  const checkDuplicateForB = await checkDuplicateProperty("PROP-100", "Sector 1", null);
  assert.strictEqual(
    checkDuplicateForB.isDuplicate,
    false,
    "Client B must be permitted to use PROP-100 because Client A's namespace is separate"
  );

  // But Client A creating a second 'PROP-100' within Org A is flagged
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");
  const checkDuplicateForA = await checkDuplicateProperty("PROP-100", "Sector 1", null);
  assert.strictEqual(
    checkDuplicateForA.isDuplicate,
    true,
    "Duplicate check within Client A's own organization must detect PROP-100 collision"
  );
  console.log("✔ Test 7 Passed: Each client has their own independent property code namespace");

  // =========================================================================
  // TEST 8: Dashboard Metrics Partitioning
  // =========================================================================
  setActiveWorkspace(ORG_A_ID, ORG_A_NAME, "Agent Alice", "owner");
  const metricsA = await getDashboardMetrics();

  setActiveWorkspace(ORG_B_ID, ORG_B_NAME, "Agent Bob", "owner");
  const metricsB = await getDashboardMetrics();

  // Metrics must be independently tallied
  assert.strictEqual(metricsA.totalProperties >= 3, true, "Org A has at least 3 properties");
  assert.strictEqual(metricsB.totalProperties === 1, true, "Org B has exactly 1 property");
  assert.notStrictEqual(metricsA.totalProperties, metricsB.totalProperties, "Metrics are strictly separated");
  console.log("✔ Test 8 Passed: Dashboard metrics are computed strictly per tenant");

  console.log("\n✨ All 8 Multi-Organization Isolation & Tenant Partitioning tests PASSED successfully!\n");
}

runMultiOrgTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
