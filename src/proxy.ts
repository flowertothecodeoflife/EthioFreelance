import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isAdminRoute      = nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = nextUrl.pathname === "/admin/login";

  if (isAdminRoute) {
    // Always allow the login page through
    if (isAdminLoginRoute) {
      return NextResponse.next();
    }

    // All other /admin/* routes require the admin_session cookie
    const adminSession = req.cookies.get("admin_session")?.value;
    if (adminSession !== "authenticated") {
      const loginUrl = new URL("/admin/login", nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // If the admin cookie somehow exists outside /admin routes, clear it
    if (req.cookies.has("admin_session")) {
      const response = NextResponse.next();
      response.cookies.delete("admin_session");
      return response;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
