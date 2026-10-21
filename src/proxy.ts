import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decodeSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes("your-project-id") &&
    !anonKey.includes("your-anon-key")
  );

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/requirements") ||
    pathname.startsWith("/matches") ||
    pathname.startsWith("/follow-ups") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/settings");

  // Always allow API routes without redirect loops
  if (isApiAuthRoute) {
    return response;
  }

  // 1. Check custom OTP session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = sessionToken ? decodeSession(sessionToken) : null;
  let isAuthenticated = Boolean(sessionUser);

  // 2. Check Supabase live session if available and not yet authenticated
  if (!isAuthenticated && isConfigured) {
    try {
      const supabase = createServerClient(url!, anonKey!, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        isAuthenticated = true;
      }
    } catch {
      // Supabase probe failover
    }
  }

  // If user is not logged in and attempts to access protected route -> redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is already logged in and visits login -> redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
