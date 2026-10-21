import { NextRequest, NextResponse } from "next/server";
import { getPropertyById, updateProperty, archiveProperty } from "@/lib/data/store";
import { propertySchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching property";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { media, ...propertyData } = body;

    const parsed = propertySchema.safeParse(propertyData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await updateProperty(id, {
      ...parsed.data,
      ...(media ? { media } : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      property: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating property";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const archived = await archiveProperty(id);

    if (!archived) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error archiving property";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
