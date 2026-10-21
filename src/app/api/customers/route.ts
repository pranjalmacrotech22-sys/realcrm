import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createCustomer, getCustomers } from "@/lib/data/store";
import { customerSchema } from "@/lib/validations";

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
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const created = await createCustomer({
      ...parsed.data,
      organization_id: orgId,
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      customer: created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const customers = await getCustomers();
    return NextResponse.json({ customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
