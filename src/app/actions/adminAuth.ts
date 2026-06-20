"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

// Derive a signing secret from env — falls back to a dev-only value
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-secret-change-in-prod";

function sign(value: string): string {
  return createHmac("sha256", ADMIN_SECRET).update(value).digest("hex");
}

export function verifyAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  try {
    const expected = sign(payload);
    // timingSafeEqual prevents timing attacks
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function loginAdmin(prevState: any, formData: FormData) {
  try {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      return { error: "Username and password are required." };
    }

    const adminUser = process.env.ADMIN_USERNAME ?? "Admin";
    const adminPass = process.env.ADMIN_PASSWORD ?? "4dmin1234";

    if (username !== adminUser || password !== adminPass) {
      return { error: "Invalid username or password." };
    }

    // Sign the payload so the cookie can't be forged by setting it to "authenticated"
    const payload = "authenticated";
    const sessionValue = `${payload}.${sign(payload)}`;

    const cookieStore = await cookies();
    cookieStore.set({
      name: "admin_session",
      value: sessionValue,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return { success: true };
  } catch (err: any) {
    console.error("Admin login error:", err);
    return { error: "An unexpected error occurred during login." };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}
