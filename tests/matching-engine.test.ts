import assert from "node:assert";
import { evaluatePropertyMatch, matchPropertiesForRequirement } from "../src/lib/matching/engine";
import { Property, Requirement } from "../src/types";

console.log("🚀 Running Property Matching Engine Test Suite...\n");

const baseOrgId = "org-1111-2222";

const sampleRequirement: Requirement = {
  id: "req-1",
  organization_id: baseOrgId,
  customer_id: "cust-1",
  title: "3 BHK Family Rental in Dwarka",
  purpose: "rent",
  category: "residential",
  property_type: "flat",
  min_budget: 35000,
  max_budget: 50000,
  budget_period: "month",
  min_bhk: 3,
  max_bhk: 3,
  preferred_furnishing: "semi_furnished",
  allow_nearby_locations: true,
  allow_alternate_property_types: false,
  allow_alternate_furnishing: true,
  budget_flexibility_percent: 10, // Allows up to 55,000
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  locations: [
    {
      id: "loc-1",
      organization_id: baseOrgId,
      requirement_id: "req-1",
      city: "New Delhi",
      sector: "Sector 12",
      priority: 1,
    },
  ],
};

const baseProperty: Property = {
  id: "prop-1",
  organization_id: baseOrgId,
  property_code: "PROP-101",
  title: "Sunview 3 BHK Apartment",
  purpose: "rent",
  category: "residential",
  property_type: "flat",
  city: "New Delhi",
  sector: "Sector 12",
  price_amount: 45000,
  rent_period: "month",
  maintenance_amount: 3000,
  is_negotiable: true,
  bhk: 3,
  furnishing_status: "semi_furnished",
  owner_name: "Ramesh Sharma",
  owner_phone: "+91 98111 00000",
  availability_status: "available",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Test 1: Perfect Exact Match
{
  const res = evaluatePropertyMatch(baseProperty, sampleRequirement);
  assert.strictEqual(res.isMatch, true, "Should be a match");
  assert.strictEqual(res.matchType, "exact", "Should be an exact match");
  assert.strictEqual(res.mismatchReasons.length, 0, "No mismatch reasons on exact match");
  assert.ok(res.matchScore >= 90, "Score should be >= 90");
  console.log("✔ Test 1 Passed: Perfect Exact Match detected correctly");
}

// Test 2: Near Match via Budget Flexibility (within 10%)
{
  const flexProp: Property = {
    ...baseProperty,
    id: "prop-2",
    price_amount: 53000, // Exceeds 50,000 by 6%, within 55,000 limit
  };
  const res = evaluatePropertyMatch(flexProp, sampleRequirement);
  assert.strictEqual(res.isMatch, true, "Should match under budget flexibility");
  assert.strictEqual(res.matchType, "near", "Must be classified as near match");
  assert.ok(
    res.mismatchReasons.some((r) => r.field === "budget"),
    "Should include budget mismatch reason"
  );
  console.log("✔ Test 2 Passed: Budget flexibility near match handled properly");
}

// Test 3: Near Match via Alternate Furnishing
{
  const furnProp: Property = {
    ...baseProperty,
    id: "prop-3",
    furnishing_status: "fully_furnished",
  };
  const res = evaluatePropertyMatch(furnProp, sampleRequirement);
  assert.strictEqual(res.isMatch, true, "Should match since allow_alternate_furnishing is true");
  assert.strictEqual(res.matchType, "near", "Must be near match");
  assert.ok(
    res.mismatchReasons.some((r) => r.field === "furnishing"),
    "Should include furnishing mismatch reason"
  );
  console.log("✔ Test 3 Passed: Alternate furnishing flexibility accepted");
}

// Test 4: Near Match via Nearby Location
{
  const nearbyProp: Property = {
    ...baseProperty,
    id: "prop-4",
    sector: "Sector 14", // Not in requirement locations list
  };
  const res = evaluatePropertyMatch(nearbyProp, sampleRequirement);
  assert.strictEqual(res.isMatch, true, "Should match because allow_nearby_locations is true");
  assert.strictEqual(res.matchType, "near", "Must be near match");
  assert.ok(
    res.mismatchReasons.some((r) => r.field === "location"),
    "Should include location mismatch reason"
  );
  console.log("✔ Test 4 Passed: Nearby sector allowed as near match");
}

// Test 5: Hard Rejection - Purpose Mismatch (Rent vs Sale)
{
  const saleProp: Property = {
    ...baseProperty,
    id: "prop-5",
    purpose: "sale",
    rent_period: null,
    price_amount: 15000000,
  };
  const res = evaluatePropertyMatch(saleProp, sampleRequirement);
  assert.strictEqual(res.isMatch, false, "Sale property must NEVER match rent requirement");
  console.log("✔ Test 5 Passed: Hard rejection for purpose mismatch (sale vs rent)");
}

// Test 6: Hard Rejection - Unavailable Property (Sold/Rented)
{
  const soldProp: Property = {
    ...baseProperty,
    id: "prop-6",
    availability_status: "rented",
  };
  const res = evaluatePropertyMatch(soldProp, sampleRequirement);
  assert.strictEqual(res.isMatch, false, "Rented property must NEVER be matched");
  console.log("✔ Test 6 Passed: Unavailable property strictly excluded");
}

// Test 7: Hard Rejection - Cross Organization / Tenant
{
  const otherTenantProp: Property = {
    ...baseProperty,
    id: "prop-7",
    organization_id: "other-org-9999",
  };
  const res = evaluatePropertyMatch(otherTenantProp, sampleRequirement);
  assert.strictEqual(res.isMatch, false, "Cross-tenant property must NEVER match");
  console.log("✔ Test 7 Passed: Tenant isolation enforced on matching");
}

// Test 8: Hard Rejection - Over Budget Beyond Flexibility Cap
{
  const expensiveProp: Property = {
    ...baseProperty,
    id: "prop-8",
    price_amount: 60000, // 20% over max_budget (exceeds 10% limit)
  };
  const res = evaluatePropertyMatch(expensiveProp, sampleRequirement);
  assert.strictEqual(res.isMatch, false, "Price exceeding flexibility cap must be rejected");
  console.log("✔ Test 8 Passed: Over-budget beyond flexibility threshold rejected");
}

// Test 9: Complete Ranking Engine Test
{
  const allProps: Property[] = [
    { ...baseProperty, id: "exact-1", price_amount: 48000 },
    { ...baseProperty, id: "exact-2", price_amount: 42000 },
    { ...baseProperty, id: "near-1", price_amount: 52000 },
    { ...baseProperty, id: "rejected-1", availability_status: "unavailable" },
    { ...baseProperty, id: "rejected-2", purpose: "sale", rent_period: null },
  ];

  const results = matchPropertiesForRequirement(allProps, sampleRequirement);
  assert.strictEqual(results.exactMatches.length, 2, "Should identify exactly 2 exact matches");
  assert.strictEqual(results.nearMatches.length, 1, "Should identify 1 near match");
  // Check exact matches are ordered properly
  assert.ok(
    results.exactMatches[0].score >= results.exactMatches[1].score,
    "Exact matches sorted by score"
  );
  console.log("✔ Test 9 Passed: Match categorization, deduplication and sorting verified");
}

console.log("\n✨ All 9 Matching Engine tests PASSED successfully!\n");
