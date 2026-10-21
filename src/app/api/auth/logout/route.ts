import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
