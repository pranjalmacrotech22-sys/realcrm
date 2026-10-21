-- Migration 004: Enable Direct API & Server Access
-- Disables RLS so that the Next.js application server and API can insert and query data seamlessly
-- without requiring Supabase-specific Auth JWTs for custom email-OTP session users.

ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requirement_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;

-- Grant standard permissions to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
