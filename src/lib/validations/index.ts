import { z } from "zod";

export const propertySchema = z
  .object({
    property_code: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.trim().length >= 2 ? val.trim() : `PROP-${Math.floor(1000 + Math.random() * 9000)}`)),
    title: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : "Property Listing")),
    description: z.string().max(3000).optional().nullable(),

    // Classification
    purpose: z.preprocess(
      (val) => (val === "" || val == null ? "rent" : val),
      z.enum(["rent", "sale", "lease"]).default("rent")
    ),
    category: z.preprocess(
      (val) => (val === "" || val == null ? "residential" : val),
      z.enum(["residential", "commercial", "land"]).default("residential")
    ),
    property_type: z.preprocess(
      (val) => (val === "" || val == null ? "flat" : val),
      z.enum([
        "flat",
        "builder_floor",
        "villa",
        "plot",
        "shop",
        "office",
        "warehouse",
        "other",
      ]).default("flat")
    ),

    // Location
    city: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : "New Delhi")),
    locality: z.string().max(100).optional().nullable(),
    sector: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : "General")),
    society_name: z.string().max(150).optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    pincode: z
      .string()
      .optional()
      .nullable()
      .or(z.literal("")),

    // Pricing
    price_amount: z.coerce.number().min(0).default(0),
    rent_period: z
      .enum(["month", "week", "day", "year"])
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),
    maintenance_amount: z.coerce.number().min(0).default(0),
    is_negotiable: z.boolean().default(false),

    // Residential fields
    bhk: z.coerce.number().min(0.5).max(20).optional().nullable(),
    bathrooms: z.coerce.number().int().min(0).max(20).optional().nullable(),
    balconies: z.coerce.number().int().min(0).max(10).optional().nullable(),
    furnishing_status: z
      .enum(["unfurnished", "semi_furnished", "fully_furnished"])
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),
    floor_number: z.coerce.number().int().optional().nullable(),
    total_floors: z.coerce.number().int().min(1).optional().nullable(),
    parking: z.string().max(100).optional().nullable(),

    // Area
    carpet_area_sqft: z.coerce.number().positive().optional().nullable(),
    builtup_area_sqft: z.coerce.number().positive().optional().nullable(),
    plot_area_sqft: z.coerce.number().positive().optional().nullable(),

    // Commercial fields
    frontage_ft: z.coerce.number().positive().optional().nullable(),
    permitted_use: z.string().max(150).optional().nullable(),
    lease_term_months: z.coerce.number().int().positive().optional().nullable(),

    // Plot fields
    plot_width_ft: z.coerce.number().positive().optional().nullable(),
    plot_length_ft: z.coerce.number().positive().optional().nullable(),
    road_width_ft: z.coerce.number().positive().optional().nullable(),
    land_use: z.string().max(100).optional().nullable(),

    // Ownership & Management
    owner_name: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : "Direct Owner")),
    owner_phone: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : "")),
    source_type: z.string().max(50).optional().nullable(),
    assigned_to: z.string().optional().nullable(),

    // Availability
    availability_status: z.preprocess(
      (val) => (val === "" || val == null ? "available" : val),
      z
        .enum(["available", "on_hold", "under_negotiation", "sold", "rented", "unavailable"])
        .default("available")
    ),
    available_from: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate pricing consistency
    if ((data.purpose === "rent" || data.purpose === "lease") && !data.rent_period) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rent_period"],
        message: "Rent period (e.g. per month) is required for rental/lease properties",
      });
    }
    if (data.purpose === "sale" && data.rent_period) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rent_period"],
        message: "Rent period must not be specified for sale properties",
      });
    }
  });

export const customerSchema = z.object({
  full_name: z.string().min(2, "Full name is required").max(120).trim(),
  phone: z.string().min(10, "Enter a valid phone number (at least 10 digits)").max(20).trim(),
  alternate_phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  customer_type: z.enum(["buyer", "tenant", "investor", "seller", "landlord"]),
  source: z.string().max(80).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const requirementLocationSchema = z.object({
  city: z.string().min(2, "City is required").trim(),
  locality: z.string().optional().nullable(),
  sector: z.string().min(1, "Sector is required").trim(),
  priority: z.coerce.number().int().default(1),
});

export const requirementSchema = z
  .object({
    customer_id: z.string().uuid("Customer is required"),
    title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
    purpose: z.enum(["rent", "sale", "lease"]),
    category: z.enum(["residential", "commercial", "land"]),
    property_type: z
      .enum([
        "flat",
        "builder_floor",
        "villa",
        "plot",
        "shop",
        "office",
        "warehouse",
        "other",
      ])
      .optional()
      .nullable(),
    min_budget: z.coerce.number().min(0).optional().nullable(),
    max_budget: z.coerce.number().positive("Maximum budget must be greater than zero"),
    budget_period: z.enum(["month", "week", "day", "year"]).optional().nullable(),
    min_area_sqft: z.coerce.number().positive().optional().nullable(),
    max_area_sqft: z.coerce.number().positive().optional().nullable(),
    min_bhk: z.coerce.number().min(0.5).max(20).optional().nullable(),
    max_bhk: z.coerce.number().min(0.5).max(20).optional().nullable(),
    preferred_furnishing: z
      .enum(["unfurnished", "semi_furnished", "fully_furnished"])
      .optional()
      .nullable(),
    allow_nearby_locations: z.boolean().default(false),
    allow_alternate_property_types: z.boolean().default(false),
    allow_alternate_furnishing: z.boolean().default(false),
    budget_flexibility_percent: z.coerce.number().min(0).max(100).default(0),
    status: z.enum(["active", "on_hold", "fulfilled", "closed"]).default("active"),
    assigned_to: z.string().uuid().optional().nullable(),
    locations: z.array(requirementLocationSchema).min(1, "At least one target location/sector is required"),
  })
  .superRefine((data, ctx) => {
    if ((data.purpose === "rent" || data.purpose === "lease") && !data.budget_period) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget_period"],
        message: "Budget period is required for rental requirements",
      });
    }
    if (data.min_budget && data.max_budget && data.min_budget > data.max_budget) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min_budget"],
        message: "Minimum budget cannot be higher than maximum budget",
      });
    }
  });

export const followUpSchema = z.object({
  customer_id: z.string().uuid("Customer is required"),
  requirement_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Follow-up title is required").max(150).trim(),
  due_at: z.string().min(1, "Follow-up due date is required"),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  notes: z.string().max(1000).optional().nullable(),
});

export const organizationSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(100).trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});
