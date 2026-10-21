-- Migration 003: Seed Data (Demo Organization, Properties, Customers, Requirements)
-- Suitable for running in Supabase SQL Editor for instant testing

DO $$
DECLARE
    v_org_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_user_id UUID;
    v_prop_1 UUID := 'b0000000-0000-0000-0000-000000000001';
    v_prop_2 UUID := 'b0000000-0000-0000-0000-000000000002';
    v_prop_3 UUID := 'b0000000-0000-0000-0000-000000000003';
    v_prop_4 UUID := 'b0000000-0000-0000-0000-000000000004';
    v_prop_5 UUID := 'b0000000-0000-0000-0000-000000000005';
    v_cust_1 UUID := 'c0000000-0000-0000-0000-000000000001';
    v_cust_2 UUID := 'c0000000-0000-0000-0000-000000000002';
    v_cust_3 UUID := 'c0000000-0000-0000-0000-000000000003';
    v_req_1 UUID := 'd0000000-0000-0000-0000-000000000001';
    v_req_2 UUID := 'd0000000-0000-0000-0000-000000000002';
BEGIN
    -- 1. Create Organization
    INSERT INTO public.organizations (id, name, slug, status)
    VALUES (v_org_id, 'Apex Realty Partners', 'apex-realty', 'active')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- Pick first user if exists
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    -- 2. Create Membership if an auth user exists
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (user_id, full_name, phone)
        VALUES (v_user_id, 'Principal Broker', '+91 98765 43210')
        ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

        INSERT INTO public.memberships (organization_id, user_id, role, status)
        VALUES (v_org_id, v_user_id, 'owner', 'active')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    -- 3. Seed Properties
    -- Prop 1: 3 BHK Flat in Dwarka Sector 12 (Rent)
    INSERT INTO public.properties (
        id, organization_id, property_code, title, description,
        purpose, category, property_type,
        city, locality, sector, society_name, address, pincode,
        price_amount, rent_period, maintenance_amount, is_negotiable,
        bhk, bathrooms, balconies, furnishing_status, floor_number, total_floors, parking,
        carpet_area_sqft, builtup_area_sqft,
        owner_name, owner_phone, source_type, availability_status
    ) VALUES (
        v_prop_1, v_org_id, 'PROP-1001', '3 BHK Luxury Apartment in Platinum Heights',
        'Spacious, park-facing high-floor 3 BHK flat with modern woodwork and modular kitchen.',
        'rent', 'residential', 'flat',
        'New Delhi', 'Dwarka', 'Sector 12', 'Platinum Heights CGHS', 'Flat 702, Plot 4, Sector 12 Dwarka', '110078',
        45000, 'month', 3500, true,
        3.0, 3, 2, 'semi_furnished', 7, 10, '1 Covered Basement',
        1450, 1750,
        'Rajesh Kumar Gupta', '+91 98111 22334', 'direct_owner', 'available'
    ) ON CONFLICT (id) DO NOTHING;

    -- Prop 2: 3 BHK Flat in Dwarka Sector 12 (Rent, Fully Furnished, Slightly Higher Budget)
    INSERT INTO public.properties (
        id, organization_id, property_code, title, description,
        purpose, category, property_type,
        city, locality, sector, society_name, address, pincode,
        price_amount, rent_period, maintenance_amount, is_negotiable,
        bhk, bathrooms, balconies, furnishing_status, floor_number, total_floors, parking,
        carpet_area_sqft, builtup_area_sqft,
        owner_name, owner_phone, source_type, availability_status
    ) VALUES (
        v_prop_2, v_org_id, 'PROP-1002', 'Designer 3 BHK Fully Furnished with Balcony',
        'Designer interior done recently with Italian marble, smart home lights, split ACs.',
        'rent', 'residential', 'flat',
        'New Delhi', 'Dwarka', 'Sector 12', 'Metro View Apartments', 'Tower B, Flat 304, Sector 12', '110078',
        52000, 'month', 4000, false,
        3.0, 3, 3, 'fully_furnished', 3, 8, '2 Reserved Stilt',
        1600, 1900,
        'Sunita Mehra', '+91 98222 33445', 'referral', 'available'
    ) ON CONFLICT (id) DO NOTHING;

    -- Prop 3: 4 BHK Independent Builder Floor in Gurgaon Sector 54 (Sale)
    INSERT INTO public.properties (
        id, organization_id, property_code, title, description,
        purpose, category, property_type,
        city, locality, sector, society_name, address, pincode,
        price_amount, rent_period, maintenance_amount, is_negotiable,
        bhk, bathrooms, balconies, furnishing_status, floor_number, total_floors, parking,
        carpet_area_sqft, builtup_area_sqft,
        owner_name, owner_phone, source_type, availability_status
    ) VALUES (
        v_prop_3, v_org_id, 'PROP-1003', 'Ultra Luxury 4 BHK Builder Floor on Golf Course Road',
        'Private elevator, Italian marble, VRV ACs, terrace garden rights, close to Rapid Metro.',
        'sale', 'residential', 'builder_floor',
        'Gurugram', 'Golf Course Road', 'Sector 54', 'Suncity Township', 'Plot 42, Block C, Sector 54', '122002',
        42500000, NULL, 5000, true,
        4.0, 4, 3, 'semi_furnished', 2, 4, '2 Covered Car Parks',
        2800, 3200,
        'Vikramaditya Singhania', '+91 99333 44556', 'newspaper_ad', 'available'
    ) ON CONFLICT (id) DO NOTHING;

    -- Prop 4: Commercial Retail Shop in Sector 29 Gurugram (Lease)
    INSERT INTO public.properties (
        id, organization_id, property_code, title, description,
        purpose, category, property_type,
        city, locality, sector, society_name, address, pincode,
        price_amount, rent_period, maintenance_amount, is_negotiable,
        carpet_area_sqft, builtup_area_sqft, frontage_ft, permitted_use, lease_term_months,
        owner_name, owner_phone, source_type, availability_status
    ) VALUES (
        v_prop_4, v_org_id, 'PROP-1004', 'High-Footfall Corner Commercial Shop Ground Floor',
        'Prime corner retail outlet with wide glass frontage facing the central plaza.',
        'lease', 'commercial', 'shop',
        'Gurugram', 'Huda City Center', 'Sector 29', 'SCO Commercial Complex', 'Shop G-12, Sector 29 Market', '122001',
        185000, 'month', 12000, true,
        950, 1100, 32.5, 'Retail / Cafe / Banking', 36,
        'Manish Chawla', '+91 98444 55667', 'direct_owner', 'available'
    ) ON CONFLICT (id) DO NOTHING;

    -- Prop 5: Residential Villa Plot in Sohna Road (Sale)
    INSERT INTO public.properties (
        id, organization_id, property_code, title, description,
        purpose, category, property_type,
        city, locality, sector, society_name, address, pincode,
        price_amount, rent_period, maintenance_amount, is_negotiable,
        plot_area_sqft, plot_width_ft, plot_length_ft, road_width_ft, land_use,
        owner_name, owner_phone, source_type, availability_status
    ) VALUES (
        v_prop_5, v_org_id, 'PROP-1005', 'Corner Gated Community Villa Plot 300 SqYds',
        'East-facing corner plot in an upscale gated township with wide 45ft boulevard road.',
        'sale', 'land', 'plot',
        'Gurugram', 'Sohna Road', 'Sector 33', 'Central Park Resorts', 'Plot No. 118, Boulevard 2', '122103',
        27000000, NULL, 2000, true,
        2700, 45, 60, 45, 'Residential Villa',
        'Anil Oberoi', '+91 98555 66778', 'builder_direct', 'available'
    ) ON CONFLICT (id) DO NOTHING;

    -- 4. Seed Customers
    INSERT INTO public.customers (
        id, organization_id, full_name, phone, email, customer_type, source, notes
    ) VALUES (
        v_cust_1, v_org_id, 'Amitabh Sharma', '+91 98711 00223', 'amitabh.sharma@example.com',
        'tenant', 'walk_in', 'Senior VP at MNC looking to relocate family near Dwarka metro.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.customers (
        id, organization_id, full_name, phone, email, customer_type, source, notes
    ) VALUES (
        v_cust_2, v_org_id, 'Pooja Narang', '+91 98722 11334', 'pooja.narang@example.com',
        'buyer', 'website', 'Looking for builder floor or villa in Gurgaon Golf Course Road.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.customers (
        id, organization_id, full_name, phone, email, customer_type, source, notes
    ) VALUES (
        v_cust_3, v_org_id, 'Siddharth Varma', '+91 98733 22445', 'siddharth@retailchain.com',
        'investor', 'referral', 'Franchise retail brand looking for commercial space in Gurugram.'
    ) ON CONFLICT (id) DO NOTHING;

    -- 5. Seed Requirements
    -- Req 1: 3 BHK Flat in Dwarka Sector 12, max budget 50,000, semi-furnished
    INSERT INTO public.requirements (
        id, organization_id, customer_id, title, purpose, category, property_type,
        min_budget, max_budget, budget_period, min_bhk, max_bhk, preferred_furnishing,
        allow_nearby_locations, allow_alternate_property_types, allow_alternate_furnishing,
        budget_flexibility_percent, status
    ) VALUES (
        v_req_1, v_org_id, v_cust_1, '3 BHK Flat in Dwarka for Executive Family',
        'rent', 'residential', 'flat',
        35000, 50000, 'month', 3.0, 3.0, 'semi_furnished',
        true, false, true, 10.0, 'active'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.requirement_locations (
        organization_id, requirement_id, city, sector, priority
    ) VALUES 
    (v_org_id, v_req_1, 'New Delhi', 'Sector 12', 1),
    (v_org_id, v_req_1, 'New Delhi', 'Sector 11', 2)
    ON CONFLICT DO NOTHING;

    -- 6. Seed Follow-ups
    INSERT INTO public.follow_ups (
        organization_id, customer_id, requirement_id, property_id,
        title, due_at, status, notes
    ) VALUES (
        v_org_id, v_cust_1, v_req_1, v_prop_1,
        'Site Visit: Platinum Heights 702', now() + interval '1 day', 'pending',
        'Client requested 11:30 AM visit with spouse.'
    ) ON CONFLICT DO NOTHING;

END $$;
