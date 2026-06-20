import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/adminSession";

const { auth } = NextAuth(authConfig);

const SUPPORTED_LOCALES = ["en", "am"] as const;
const DEFAULT_LOCALE    = "en";

/**
 * Reads the preferred locale from the NEXT_LOCALE cookie,
 * falling back to Accept-Language header, then the default.
 */
function resolveLocale(req: NextRequest): string {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && (SUPPORTED_LOCALES as readonly string[]).includes(cookie)) return cookie;

  const accept = req.headers.get("accept-language") ?? "";
  const preferred = accept.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (preferred && (SUPPORTED_LOCALES as readonly string[]).includes(preferred)) return preferred;

  return DEFAULT_LOCALE;
}

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isAdminRoute      = nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = nextUrl.pathname === "/admin/login";

  // ── Admin route protection ─────────────────────────────────────────────
  if (isAdminRoute) {
    if (isAdminLoginRoute) return NextResponse.next();

    const adminSession = req.cookies.get("admin_session")?.value;
    if (!verifyAdminSession(adminSession)) {
      const loginUrl = new URL("/admin/login", nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    if (req.cookies.has("admin_session")) {
      const response = NextResponse.next();
      response.cookies.delete("admin_session");
      return response;
    }
  }

  // ── Locale persistence ─────────────────────────────────────────────────
  // If no NEXT_LOCALE cookie is set yet, write the resolved locale so that
  // the i18n/request.ts server config always has a value to read.
  if (!req.cookies.has("NEXT_LOCALE")) {
    const locale   = resolveLocale(req);
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
