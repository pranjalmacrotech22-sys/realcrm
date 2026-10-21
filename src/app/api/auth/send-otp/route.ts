import { NextRequest, NextResponse } from "next/server";
import { createAndSendOtp } from "@/lib/auth/otp";
import { getAccountByEmail } from "@/lib/data/store";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, isSignUp, fullName, organizationName } = body;

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid work email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters in length." },
        { status: 400 }
      );
    }

    // Check existing account state
    const existing = await getAccountByEmail(cleanEmail);

    if (isSignUp) {
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in with your password." },
          { status: 400 }
        );
      }
      if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
        return NextResponse.json(
          { error: "Please provide your full name." },
          { status: 400 }
        );
      }
      if (!organizationName || typeof organizationName !== "string" || organizationName.trim().length < 2) {
        return NextResponse.json(
          { error: "Please provide your company or brokerage name." },
          { status: 400 }
        );
      }
    } else {
      // Sign-in flow: check if account exists
      if (!existing) {
        return NextResponse.json(
          {
            error: "No account found for this email. Please click 'Register Workspace' to create your account.",
            code: "ACCOUNT_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      // If account has an established password, verify it
      if (existing.passwordHash) {
        const isValid = verifyPassword(password, existing.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Incorrect password. Please verify your credentials and try again." },
            { status: 401 }
          );
        }
      }
    }

    // Send 6-digit OTP code to email
    const result = await createAndSendOtp(cleanEmail);

    const response = NextResponse.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt,
      token: result.token,
    });

    if (result.token) {
      response.cookies.set("realcrm_otp_challenge", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600, // 10 minutes
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send verification code";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
