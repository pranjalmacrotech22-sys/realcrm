import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createRequirement, getRequirements } from "@/lib/data/store";
import { requirementSchema } from "@/lib/validations";

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
    const parsed = requirementSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const created = await createRequirement({
      ...parsed.data,
      organization_id: orgId,
      locations: (body.locations || []).map((l: any, i: number) => ({
        id: `loc-${Date.now()}-${i}`,
        organization_id: orgId,
        requirement_id: "temp-req",
        city: l.city,
        locality: l.locality,
        sector: l.sector,
        priority: l.priority || 1,
      })),
    });

    return NextResponse.json({
      success: true,
      requirement: created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating requirement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const requirements = await getRequirements();
    return NextResponse.json({ requirements });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching requirements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
