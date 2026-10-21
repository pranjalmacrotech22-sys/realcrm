import { NextRequest, NextResponse } from "next/server";
import { checkDuplicateProperty } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, sector, society, excludeId } = body;

    if (!code || !sector) {
      return NextResponse.json({ isDuplicate: false });
    }

    const check = await checkDuplicateProperty(code, sector, society, excludeId);
    return NextResponse.json(check);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error checking duplicate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
