import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createProperty, getProperties } from "@/lib/data/store";
import { propertySchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your organization." },
        { status: 401 }
      );
    }
    const orgId = session.organizationId;

    const body = await request.json();
    const { media, ...propertyData } = body;

    const parsed = propertySchema.safeParse(propertyData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const created = await createProperty({
      ...parsed.data,
      organization_id: orgId,
      media: media || [],
    });

    return NextResponse.json({
      success: true,
      property: created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating property";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      city: searchParams.get("city") || undefined,
      sector: searchParams.get("sector") || undefined,
      society: searchParams.get("society") || undefined,
      purpose: (searchParams.get("purpose") as any) || undefined,
      category: (searchParams.get("category") as any) || undefined,
      property_type: (searchParams.get("property_type") as any) || undefined,
      min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
      max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
      bhk: searchParams.get("bhk") ? Number(searchParams.get("bhk")) : undefined,
      availability: (searchParams.get("availability") as any) || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    };

    const result = await getProperties(filters);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching properties";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
