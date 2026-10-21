import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateMemberRole, getTeamMembers } from "@/lib/data/store";
import { UserRole } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }
    const members = await getTeamMembers();
    return NextResponse.json({ members });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching team members";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your organization." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Member ID and role are required." },
        { status: 400 }
      );
    }

    const updated = await updateMemberRole(memberId, role as UserRole);

    if (!updated) {
      return NextResponse.json(
        { error: "Member not found." },
        { status: 404 }
      );
    }

    revalidatePath("/team");

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating role";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
