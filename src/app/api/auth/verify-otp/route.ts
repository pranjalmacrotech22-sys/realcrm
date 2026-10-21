import { NextRequest, NextResponse } from "next/server";
import { verifyOtpCode } from "@/lib/auth/otp";
import { encodeSession, SESSION_COOKIE_NAME, SessionUser } from "@/lib/auth/session";
import { getAccountByEmail, saveAccount, setActiveWorkspace } from "@/lib/data/store";
import { hashPassword } from "@/lib/auth/password";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, fullName, organizationName, password } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Both email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const verification = verifyOtpCode(email, code);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason || "Invalid verification code." },
        { status: 401 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Look up if user previously registered with this email
    const existing = await getAccountByEmail(cleanEmail);

    let userId: string;
    let orgId: string;
    let finalName: string;
    let finalOrgName: string;
    let finalRole: UserRole = "owner";
    let passwordHash = existing?.passwordHash;

    if (password && typeof password === "string" && password.length >= 6) {
      passwordHash = hashPassword(password);
    }

    if (existing) {
      userId = existing.userId;
      orgId = existing.organizationId;
      finalName = fullName?.trim() || existing.userName;
      finalOrgName = organizationName?.trim() || existing.organizationName;
      finalRole = existing.role;

      // Update account
      await saveAccount({
        email: cleanEmail,
        passwordHash,
        userId,
        userName: finalName,
        organizationId: orgId,
        organizationName: finalOrgName,
        role: finalRole,
      });
    } else {
      // Derive readable default name from email if not given
      const prefix = cleanEmail.split("@")[0].replace(/[._-]+/g, " ");
      const capitalized = prefix
        .split(" ")
        .map((w: string) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ")
        .trim();

      finalName = fullName?.trim() || capitalized || "Broker";
      finalOrgName =
        organizationName?.trim() || (capitalized ? `${capitalized} Real Estate` : "My Real Estate Workspace");
      userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      orgId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      finalRole = "owner";

      await saveAccount({
        email: cleanEmail,
        passwordHash,
        userId,
        userName: finalName,
        organizationId: orgId,
        organizationName: finalOrgName,
        role: finalRole,
      });
    }

    // Set active workspace context
    setActiveWorkspace(orgId, finalOrgName, finalName, finalRole);

    const user: SessionUser = {
      id: userId,
      email: cleanEmail,
      name: finalName,
      role: finalRole,
      organizationId: orgId,
      organizationName: finalOrgName,
      authenticatedAt: new Date().toISOString(),
    };

    const token = encodeSession(user);

    const response = NextResponse.json({
      success: true,
      message: "Successfully verified.",
      user,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
