# RealCRM — Production-Ready Real Estate Inventory & Matching SaaS MVP

A private, multi-tenant Real Estate Inventory Management and Customer Requirement Matching SaaS application built with **Next.js (App Router, React 19, TypeScript strict mode)**, **Tailwind CSS**, and **Supabase (PostgreSQL, Row Level Security, SSR Auth, Storage)**.

Designed for real estate brokerage teams with private inventory management, duplicate prevention, multi-dimensional property search, customer tracking, follow-up scheduling, and a deterministic rule-based matching engine.

---

## 1. Features Overview

### 🏢 Property Inventory Management
* **Multi-Category Coverage**: Residential Flats, Builder Floors, Luxury Villas, Plots/Land, Commercial Retail Shops, Offices, and Warehouses.
* **Multi-Section Entry Form**:
  1. Basic info (property code, title, description)
  2. Classification (purpose: rent/sale/lease, category: residential/commercial/land, property type)
  3. Location (city, locality, sector, society name, unit address, PIN code)
  4. Pricing & Commercials (purpose-validated price amount, rent period for rentals, maintenance, negotiable toggle)
  5. Conditional Configurations (BHK, bathrooms, balconies, furnishing, floor number, parking for residential; frontage, permitted use, lease term for commercial; plot dimensions, road width, land use for land)
  6. Area measurements (carpet area, built-up area, plot area in sq. ft.)
  7. Private Owner & Source details (owner name, phone, acquisition lead source)
  8. Photos and media gallery with reordering and removal
  9. Availability & timeline (available, on hold, under negotiation, sold, rented)
* **Real-time Duplicate Warning**: Heuristic duplicate detection checks existing property codes, sector, and society combinations before submission.
* **Soft Archiving**: Archive and restore listings without losing audit trails.

### 🔍 Advanced Property Search & Filter Engine
* **Multi-Dimensional Filters**: Filter by purpose, category, property type, sector, city, BHK count, furnishing status, availability, and min/max price.
* **Instant Dynamic Toggles**: Switch between **Responsive Grid Cards** and **Data Table** view.
* **Sort Options**: Sort by date added, price, or last verified date.
* **Debounced Text Search**: Search across property codes, titles, society names, sectors, and owner names.

### 👥 Customer Management
* Client profile management for **Buyers, Tenants, Investors, Sellers, and Landlords**.
* Contact details (phone, alternate phone, email) with role-based visibility.
* History of customer requirements, scheduled follow-ups, and interaction timeline.

### 📋 Requirement Management & Matching Launcher
* Customer requirement logging with purpose, category, budget limits, and period.
* **Multi-Location Preferences**: Support for multiple target sectors and localities with priority ordering.
* **Smart Flexibility Controls**:
  - Allow nearby sectors/localities within the same city
  - Allow alternate property types (e.g. Builder Floor instead of Flat)
  - Allow alternate furnishing (e.g. Semi-Furnished instead of Fully Furnished)
  - Configurable budget flexibility slider (0% to 25%)

### ⚡ Deterministic Smart Property Matching Engine
* **Hard Non-Negotiable Constraints**:
  - Cross-tenant inventory is strictly rejected (RLS & engine isolation).
  - Purpose must match strictly (Rent != Sale).
  - Unavailable or sold properties are completely excluded.
  - Rent period must match for rentals (e.g., monthly).
* **Exact Matches**: Must satisfy 100% of location, budget cap, BHK, and furnishing criteria. Scored 90–100%.
* **Near Matches**: Permitted only when corresponding flexibility options are explicitly enabled.
* **Structured Mismatch Reasons**: Clear variance explanations returned for each near match (e.g., *"Budget exceeds primary cap by 6% (within allowed 10% flexibility)"*, *"Furnishing is semi-furnished instead of fully-furnished"*).
* Exact matches are always displayed first, followed by near matches.

### 📊 Dashboard with Real Database Metrics
* Real-time metrics computed directly from authorized records:
  - Total Properties, Available Properties, Rent vs Sale count
  - Residential, Commercial, and Land distribution bars
  - Active Customers and Requirements counts
  - Pending Follow-ups count
  - Micro-market inventory distribution by sector
  - Recently added properties list & upcoming site visits

### 🛡️ Team & Role-Based Access Control (RBAC)
* Supported Roles:
  - **`owner`**: Full workspace administration and billing/organization configuration.
  - **`admin`**: Team member management and inventory control.
  - **`manager`**: Inventory, customer assignment, and follow-up management.
  - **`agent`**: Property listing, customer management, and match generation.
  - **`viewer`**: Read-only access to inventory and customer profiles.
* **Self-Elevation Prevention**: Non-owners cannot elevate their own role or promote themselves.

---

## 2. Technology Stack

* **Frontend Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions)
* **Runtime & UI**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) (Strict mode)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom SaaS neutral palette
* **Icons**: [Lucide React](https://lucide.dev/)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, SSR Cookie Auth, Storage)
* **Validation**: [Zod](https://zod.dev/)

---

## 3. Database Schema & Migration Files

All version-controlled SQL migrations are located in `supabase/migrations/`:

| Migration File | Description |
|---|---|
| [`20261019000001_initial_schema.sql`](file:///Users/vishalsingh/Desktop/realcrm/supabase/migrations/20261019000001_initial_schema.sql) | Creates all 11 tables (`organizations`, `profiles`, `memberships`, `properties`, `property_media`, `customers`, `requirements`, `requirement_locations`, `property_matches`, `follow_ups`, `activities`), foreign keys, check constraints, composite unique indexes, and `updated_at` triggers. |
| [`20261019000002_rls_and_storage.sql`](file:///Users/vishalsingh/Desktop/realcrm/supabase/migrations/20261019000002_rls_and_storage.sql) | Enables PostgreSQL Row Level Security (RLS) on all 11 tables, defines `get_user_organizations()` and `has_org_role()`, creates multi-tenant SELECT/INSERT/UPDATE/DELETE policies, and provisions the `property-media` private storage bucket with security policies. |
| [`20261019000003_seed_data.sql`](file:///Users/vishalsingh/Desktop/realcrm/supabase/migrations/20261019000003_seed_data.sql) | Seeds realistic real estate inventory (apartments in Dwarka, luxury builder floors in Gurgaon Golf Course Road, commercial shops in Sector 29, villa plots in Sohna Road), sample customers, multi-location requirements, and follow-ups. |

---

## 4. Getting Started & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

If you do not have Supabase credentials yet, the application runs automatically in **Local Demo Mode** pre-loaded with realistic inventory and customer records.

When linking your live Supabase project, set:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Automated Tests

The application includes unit and integration tests covering the deterministic matching engine, pricing validations, and PostgreSQL RLS tenant isolation guards:

```bash
npm test
```

### Test Suite Execution Output:
* **Property Matching Engine**:
  - ✔ Perfect Exact Match detected correctly
  - ✔ Budget flexibility near match handled properly
  - ✔ Alternate furnishing flexibility accepted
  - ✔ Nearby sector allowed as near match
  - ✔ Hard rejection for purpose mismatch (sale vs rent)
  - ✔ Unavailable property strictly excluded
  - ✔ Tenant isolation enforced on matching
  - ✔ Over-budget beyond flexibility threshold rejected
  - ✔ Match categorization, deduplication, and sorting verified
* **Data Validations**:
  - ✔ Valid rental property passed validation
  - ✔ Rental property without rent period rejected
  - ✔ Sale property with rent period rejected
  - ✔ Min budget exceeding max budget rejected
* **Tenant Isolation & Security Policies**:
  - ✔ Cross-tenant SELECT read denied by RLS policy
  - ✔ Cross-tenant property INSERT/UPDATE denied by RLS policy
  - ✔ Viewer role denied write access to properties
  - ✔ Agent role granted property write access in own organization
  - ✔ Self-role elevation prevention verified
  - ✔ Matching engine strictly rejects cross-tenant inventory

---

## 6. Supabase Setup Checklist

When connecting to a new Supabase cloud project:

1. **Create Supabase Project**: In the [Supabase Dashboard](https://database.new), create a new organization and project.
2. **Execute Migrations**: Open the Supabase **SQL Editor** and run the files in sequence:
   1. `supabase/migrations/20261019000001_initial_schema.sql`
   2. `supabase/migrations/20261019000002_rls_and_storage.sql`
   3. `supabase/migrations/20261019000003_seed_data.sql` (optional for demo data)
3. **Verify Storage Bucket**: Ensure the private bucket `property-media` exists in **Storage** with RLS policies enabled.
4. **Copy API Keys**: Retrieve the Project URL and Anon/Public Key from **Project Settings > API** and place them in `.env.local`.

---

## 7. Known Limitations & MVP Scope

* **No Payment/Subscription Gateways**: Intentionally excluded for the private team MVP.
* **No Public Marketplace**: Property inventory is completely internal and protected by RLS.
* **No OCR Diary Scanner**: Properties are entered manually through the multi-section form.
* **Local Sandbox Mode**: When Supabase credentials are not provided, an in-memory persistent store allows instant zero-config testing.
