-- Migration 002: Row Level Security (RLS) & Storage Security
-- Enforces strict multi-tenant isolation, role-based access, and storage bucket security

-- Helper: Get all active organizations for current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(org_id UUID) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
    SELECT organization_id
    FROM public.memberships
    WHERE user_id = auth.uid()
      AND status = 'active';
$$;

-- Helper: Check if current user has an active membership with one of the allowed roles
CREATE OR REPLACE FUNCTION public.has_org_role(target_org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.memberships
    WHERE organization_id = target_org_id
      AND user_id = auth.uid()
      AND status = 'active';
      
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN user_role = ANY(allowed_roles);
END;
$$;

-- ====================================================================
-- ENABLE RLS ON ALL TABLES
-- ====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLICIES: PROFILES
-- ====================================================================
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- POLICIES: ORGANIZATIONS
-- ====================================================================
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_organizations()));

CREATE POLICY "Authenticated users can create an organization"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Owners and admins can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (has_org_role(id, ARRAY['owner', 'admin']))
WITH CHECK (has_org_role(id, ARRAY['owner', 'admin']));

-- ====================================================================
-- POLICIES: MEMBERSHIPS
-- ====================================================================
CREATE POLICY "Users can view memberships within their organizations"
ON public.memberships FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

-- Secure creation of first owner membership OR admin-managed additions
CREATE POLICY "Owners and admins can add members, or creator creates initial owner"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
    -- Case 1: First owner creating organization membership for themselves
    (user_id = auth.uid() AND role = 'owner' AND NOT EXISTS (
        SELECT 1 FROM public.memberships m WHERE m.organization_id = memberships.organization_id
    ))
    OR
    -- Case 2: Org owner or admin adding team members
    (has_org_role(organization_id, ARRAY['owner', 'admin']))
);

CREATE POLICY "Owners and admins can update member roles, but not elevate own role"
ON public.memberships FOR UPDATE
TO authenticated
USING (
    has_org_role(organization_id, ARRAY['owner', 'admin'])
    AND user_id != auth.uid() -- Prevent self-role elevation
)
WITH CHECK (
    has_org_role(organization_id, ARRAY['owner', 'admin'])
    AND user_id != auth.uid()
);

CREATE POLICY "Owners and admins can remove members, but cannot remove self"
ON public.memberships FOR DELETE
TO authenticated
USING (
    has_org_role(organization_id, ARRAY['owner', 'admin'])
    AND user_id != auth.uid()
);

-- ====================================================================
-- POLICIES: PROPERTIES
-- ====================================================================
CREATE POLICY "Members can view properties in their organization"
ON public.properties FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can insert properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Authorized roles can update properties"
ON public.properties FOR UPDATE
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
)
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Owners and admins can delete properties"
ON public.properties FOR DELETE
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin'])
);

-- ====================================================================
-- POLICIES: PROPERTY MEDIA
-- ====================================================================
CREATE POLICY "Members can view property media"
ON public.property_media FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can manage property media"
ON public.property_media FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

-- ====================================================================
-- POLICIES: CUSTOMERS
-- ====================================================================
CREATE POLICY "Members can view customers in their organization"
ON public.customers FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can create customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Authorized roles can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
)
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Owners and admins can delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin'])
);

-- ====================================================================
-- POLICIES: REQUIREMENTS & LOCATIONS
-- ====================================================================
CREATE POLICY "Members can view requirements"
ON public.requirements FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can insert requirements"
ON public.requirements FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Authorized roles can update requirements"
ON public.requirements FOR UPDATE
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
)
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Members can view requirement locations"
ON public.requirement_locations FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can manage requirement locations"
ON public.requirement_locations FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

-- ====================================================================
-- POLICIES: PROPERTY MATCHES
-- ====================================================================
CREATE POLICY "Members can view property matches"
ON public.property_matches FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can manage property matches"
ON public.property_matches FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

-- ====================================================================
-- POLICIES: FOLLOW-UPS & ACTIVITIES
-- ====================================================================
CREATE POLICY "Members can view follow-ups"
ON public.follow_ups FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can manage follow-ups"
ON public.follow_ups FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Members can view activities"
ON public.activities FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Authorized roles can create activities"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
    AND has_org_role(organization_id, ARRAY['owner', 'admin', 'manager', 'agent'])
);

-- ====================================================================
-- STORAGE BUCKET & POLICIES (property-media)
-- ====================================================================
-- Create the private bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-media', 'property-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage path format: <organization_id>/<property_id>/<filename>
CREATE POLICY "Members can read their organization media"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organizations())
);

CREATE POLICY "Authorized members can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organizations())
    AND has_org_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'admin', 'manager', 'agent'])
);

CREATE POLICY "Authorized members can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'property-media'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_organizations())
    AND has_org_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'admin', 'manager'])
);
