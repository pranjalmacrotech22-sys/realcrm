import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createFollowUp, getFollowUps } from "@/lib/data/store";

export async function GET() {
  try {
    const followUps = await getFollowUps();
    return NextResponse.json({ followUps });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching follow-ups";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    if (!body.customer_id || !body.title?.trim() || !body.due_at) {
      return NextResponse.json(
        { error: "Customer, title, and due date are required." },
        { status: 400 }
      );
    }

    const created = await createFollowUp({
      organization_id: orgId,
      customer_id: body.customer_id,
      requirement_id: body.requirement_id || null,
      property_id: body.property_id || null,
      title: body.title.trim(),
      due_at: new Date(body.due_at).toISOString(),
      status: body.status || "pending",
      notes: body.notes?.trim() || null,
    });

    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      followUp: created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating follow-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
