import assert from "node:assert";
import { propertySchema, requirementSchema } from "../src/lib/validations";

console.log("🚀 Running Data Validation Test Suite...\n");

// Test 1: Valid Rental Property
{
  const validRental = {
    property_code: "PROP-201",
    title: "Modern 2 BHK Apartment",
    purpose: "rent",
    category: "residential",
    property_type: "flat",
    city: "New Delhi",
    sector: "Dwarka Sector 10",
    price_amount: 32000,
    rent_period: "month",
    maintenance_amount: 2500,
    is_negotiable: true,
    bhk: 2,
    furnishing_status: "semi_furnished",
    owner_name: "Karan Johar",
    owner_phone: "+91 98765 00000",
    availability_status: "available",
  };
  const parsed = propertySchema.safeParse(validRental);
  assert.strictEqual(parsed.success, true, "Valid rental property should parse successfully");
  console.log("✔ Test 1 Passed: Valid rental property passed validation");
}

// Test 2: Invalid Rental Property (Missing rent_period)
{
  const invalidRental = {
    property_code: "PROP-202",
    title: "Modern 2 BHK Apartment",
    purpose: "rent",
    category: "residential",
    property_type: "flat",
    city: "New Delhi",
    sector: "Dwarka Sector 10",
    price_amount: 32000,
    rent_period: null, // INVALID for rent
    owner_name: "Karan Johar",
    owner_phone: "+91 98765 00000",
  };
  const parsed = propertySchema.safeParse(invalidRental);
  assert.strictEqual(parsed.success, false, "Rental property missing rent period must fail");
  console.log("✔ Test 2 Passed: Rental property without rent period rejected");
}

// Test 3: Invalid Sale Property (Sale property with rent_period)
{
  const invalidSale = {
    property_code: "PROP-203",
    title: "Luxury 4 BHK Penthouse",
    purpose: "sale",
    category: "residential",
    property_type: "flat",
    city: "Gurugram",
    sector: "Sector 54",
    price_amount: 35000000,
    rent_period: "month", // INVALID for sale
    owner_name: "Karan Johar",
    owner_phone: "+91 98765 00000",
  };
  const parsed = propertySchema.safeParse(invalidSale);
  assert.strictEqual(parsed.success, false, "Sale property specifying rent period must fail");
  console.log("✔ Test 3 Passed: Sale property with rent period rejected");
}

// Test 4: Requirement with Min Budget > Max Budget
{
  const invalidReq = {
    customer_id: "00000000-0000-0000-0000-000000000001",
    title: "Invalid Budget Requirement",
    purpose: "rent",
    category: "residential",
    property_type: "flat",
    min_budget: 60000,
    max_budget: 40000, // min > max
    budget_period: "month",
    locations: [{ city: "Delhi", sector: "Sector 1" }],
  };
  const parsed = requirementSchema.safeParse(invalidReq);
  assert.strictEqual(parsed.success, false, "Requirement with min > max budget must fail");
  console.log("✔ Test 4 Passed: Min budget exceeding max budget rejected");
}

console.log("\n✨ All 4 Validation tests PASSED successfully!\n");
