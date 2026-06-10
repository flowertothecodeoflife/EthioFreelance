"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdmin(prevState: any, formData: FormData) {
  try {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      return { error: "Username and password are required." };
    }

    if (username !== "Admin" || password !== "4dmin1234") {
      return { error: "Invalid username or password." };
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: "admin_session",
      value: "authenticated",
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
