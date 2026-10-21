import { cookies } from "next/headers";
import { UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "realcrm_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  authenticatedAt: string;
}

const DEFAULT_SECRET = "realcrm-super-secure-enterprise-session-secret-key-2026";

/**
 * Encode a session into a base64url JSON token
 */
export function encodeSession(user: SessionUser): string {
  const payload = JSON.stringify(user);
  return Buffer.from(payload, "utf-8").toString("base64url");
}

/**
 * Decode and validate a session token string
 */
export function decodeSession(token: string): SessionUser | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.role) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to read the current authenticated user session
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

/**
 * Server-side helper to set the session cookie
 */
export async function setSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const token = encodeSession(user);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Server-side helper to clear the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
