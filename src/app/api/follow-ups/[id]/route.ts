import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { toggleFollowUpStatus } from "@/lib/data/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your organization." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const status = body.status === "completed" ? "completed" : "pending";

    const updated = await toggleFollowUpStatus(id, status);

    if (!updated) {
      return NextResponse.json(
        { error: "Follow-up not found or unauthorized." },
        { status: 404 }
      );
    }

    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      followUp: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating follow-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
