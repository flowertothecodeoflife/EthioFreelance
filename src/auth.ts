import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { authConfig } from "./auth.config";
import prisma from "@/lib/prisma";

// NOTE: PrismaAdapter is intentionally NOT used here.
// NextAuth v5 does not support combining a database adapter with the
// Credentials provider — Credentials requires JWT session strategy,
// which is incompatible with adapter-based database sessions.
// User lookups are done manually inside `authorize` using the Prisma client.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Explicitly pass the secret so NextAuth finds it regardless of
  // whether Vercel has it as AUTH_SECRET or NEXTAUTH_SECRET
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  // Required in local dev and behind proxies (Vercel sets this automatically)
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email as string },
                { phone: credentials.email as string },
              ],
            },
          });

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!passwordsMatch) return null;

          return {
            id:    user.id,
            name:  user.name,
            email: user.email,
            role:  user.role,
          } as any;
        } catch (err) {
          // DB not reachable — fail gracefully instead of crashing the route
          console.error("Auth DB error:", err);
          return null;
        }
      },
    }),
  ],
});
