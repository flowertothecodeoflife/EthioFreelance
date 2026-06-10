import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const nextUrl = request?.nextUrl;
      const isLoggedIn = !!auth?.user;

      if (!nextUrl) return true;

      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
      const isMessagesRoute = nextUrl.pathname.startsWith("/messages");
      const isPostJobRoute = nextUrl.pathname.startsWith("/post-job");
      const isProfileRoute = nextUrl.pathname.startsWith("/profile");

      if (isDashboardRoute || isMessagesRoute || isPostJobRoute || isProfileRoute) {
        if (isLoggedIn) return true;
        return false; // Automatically redirects to pages.signIn ("/login")
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  providers: [], // To be extended in auth.ts
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
