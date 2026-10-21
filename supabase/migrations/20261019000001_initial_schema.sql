-- Migration 001: Initial Schema for RealCRM Multi-Tenant Real Estate Inventory SaaS
-- Provides tables, constraints, foreign keys, indexes, and triggers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. ORGANIZATIONS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 2. PROFILES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 3. MEMBERSHIPS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'invited')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_memberships_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.memberships(organization_id);

-- ====================================================================
-- 4. PROPERTIES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    purpose TEXT NOT NULL CHECK (purpose IN ('rent', 'sale', 'lease')),
    category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'land')),
    property_type TEXT NOT NULL CHECK (property_type IN ('flat', 'builder_floor', 'villa', 'plot', 'shop', 'office', 'warehouse', 'other')),
    
    -- Location
    city TEXT NOT NULL,
    locality TEXT,
    sector TEXT NOT NULL,
    society_name TEXT,
    address TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Pricing
    price_amount NUMERIC(15, 2) NOT NULL CHECK (price_amount >= 0),
    rent_period TEXT CHECK (rent_period IN ('month', 'week', 'day', 'year') OR rent_period IS NULL),
    maintenance_amount NUMERIC(12, 2) DEFAULT 0 CHECK (maintenance_amount >= 0),
    is_negotiable BOOLEAN NOT NULL DEFAULT false,
    
    -- Residential details
    bhk NUMERIC(3, 1),
    bathrooms INTEGER CHECK (bathrooms >= 0 OR bathrooms IS NULL),
    balconies INTEGER CHECK (balconies >= 0 OR balconies IS NULL),
    furnishing_status TEXT CHECK (furnishing_status IN ('unfurnished', 'semi_furnished', 'fully_furnished') OR furnishing_status IS NULL),
    floor_number INTEGER,
    total_floors INTEGER,
    parking TEXT,
    
    -- Area
    carpet_area_sqft NUMERIC(10, 2) CHECK (carpet_area_sqft >= 0 OR carpet_area_sqft IS NULL),
    builtup_area_sqft NUMERIC(10, 2) CHECK (builtup_area_sqft >= 0 OR builtup_area_sqft IS NULL),
    plot_area_sqft NUMERIC(10, 2) CHECK (plot_area_sqft >= 0 OR plot_area_sqft IS NULL),
    
    -- Commercial details
    frontage_ft NUMERIC(8, 2),
    permitted_use TEXT,
    lease_term_months INTEGER,
    
    -- Plot details
    plot_width_ft NUMERIC(8, 2),
    plot_length_ft NUMERIC(8, 2),
    road_width_ft NUMERIC(8, 2),
    land_use TEXT,
    
    -- Ownership and management
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    source_type TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Availability
    availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'on_hold', 'under_negotiation', 'sold', 'rented', 'unavailable')),
    available_from DATE,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    
    -- System
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ,
    
    CONSTRAINT uq_properties_org_code UNIQUE (organization_id, property_code),
    CONSTRAINT chk_rent_period_consistency CHECK (
        (purpose IN ('rent', 'lease') AND rent_period IS NOT NULL) OR
        (purpose = 'sale' AND rent_period IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_properties_org ON public.properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_org_status ON public.properties(organization_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_properties_org_purpose_cat ON public.properties(organization_id, purpose, category);
CREATE INDEX IF NOT EXISTS idx_properties_org_type ON public.properties(organization_id, property_type);
CREATE INDEX IF NOT EXISTS idx_properties_org_sector ON public.properties(organization_id, sector);
CREATE INDEX IF NOT EXISTS idx_properties_org_price ON public.properties(organization_id, price_amount);
CREATE INDEX IF NOT EXISTS idx_properties_org_bhk ON public.properties(organization_id, bhk);
CREATE INDEX IF NOT EXISTS idx_properties_archived ON public.properties(archived_at);

-- ====================================================================
-- 5. PROPERTY MEDIA
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'document', 'floor_plan')),
    caption TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON public.property_media(property_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_property_media_org ON public.property_media(organization_id);

-- ====================================================================
-- 6. CUSTOMERS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    email TEXT,
    customer_type TEXT NOT NULL DEFAULT 'buyer' CHECK (customer_type IN ('buyer', 'tenant', 'investor', 'seller', 'landlord')),
    source TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON public.customers(assigned_to);

-- ====================================================================
-- 7. REQUIREMENTS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('rent', 'sale', 'lease')),
    category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'land')),
    property_type TEXT CHECK (property_type IN ('flat', 'builder_floor', 'villa', 'plot', 'shop', 'office', 'warehouse', 'other')),
    min_budget NUMERIC(15, 2) CHECK (min_budget >= 0 OR min_budget IS NULL),
    max_budget NUMERIC(15, 2) NOT NULL CHECK (max_budget >= 0),
    budget_period TEXT CHECK (budget_period IN ('month', 'week', 'day', 'year') OR budget_period IS NULL),
    min_area_sqft NUMERIC(10, 2) CHECK (min_area_sqft >= 0 OR min_area_sqft IS NULL),
    max_area_sqft NUMERIC(10, 2) CHECK (max_area_sqft >= 0 OR max_area_sqft IS NULL),
    min_bhk NUMERIC(3, 1),
    max_bhk NUMERIC(3, 1),
    preferred_furnishing TEXT CHECK (preferred_furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished') OR preferred_furnishing IS NULL),
    allow_nearby_locations BOOLEAN NOT NULL DEFAULT false,
    allow_alternate_property_types BOOLEAN NOT NULL DEFAULT false,
    allow_alternate_furnishing BOOLEAN NOT NULL DEFAULT false,
    budget_flexibility_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (budget_flexibility_percent >= 0 AND budget_flexibility_percent <= 100),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'fulfilled', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requirements_org ON public.requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_requirements_customer ON public.requirements(customer_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON public.requirements(organization_id, status);

-- ====================================================================
-- 8. REQUIREMENT LOCATIONS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.requirement_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    locality TEXT,
    sector TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_req_locations_req ON public.requirement_locations(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_locations_sector ON public.requirement_locations(organization_id, sector);

-- ====================================================================
-- 9. PROPERTY MATCHES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.property_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'near')),
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    mismatch_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_property_matches UNIQUE (requirement_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_req ON public.property_matches(requirement_id, match_type, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_prop ON public.property_matches(property_id);
CREATE INDEX IF NOT EXISTS idx_matches_org ON public.property_matches(organization_id);

-- ====================================================================
-- 10. FOLLOW-UPS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_org_due ON public.follow_ups(organization_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_customer ON public.follow_ups(customer_id);

-- ====================================================================
-- 11. ACTIVITIES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'site_visit', 'note', 'status_change', 'match_sent', 'created')),
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_customer ON public.activities(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_property ON public.activities(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id, created_at DESC);

-- ====================================================================
-- Triggers for auto-updating updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    CREATE TRIGGER trg_requirements_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    CREATE TRIGGER trg_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
