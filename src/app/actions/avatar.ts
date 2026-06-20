"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { uploadAvatar, deleteAvatar } from "@/lib/supabase-storage";

const MAX_BYTES  = 2 * 1024 * 1024; // 2 MB
const ALLOWED    = ["image/jpeg", "image/png", "image/webp"];

export async function updateAvatarAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !(session.user as any).id) {
      return { error: "You must be logged in." };
    }
    const userId = (session.user as any).id as string;

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) return { error: "No file provided." };
    if (!ALLOWED.includes(file.type))
      return { error: "Only JPEG, PNG, and WebP images are allowed." };
    if (file.size > MAX_BYTES)
      return { error: `File too large. Maximum size is 2 MB.` };

    const buffer    = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadAvatar(userId, buffer, file.type);

    await prisma.user.update({
      where: { id: userId },
      data:  { avatarUrl: publicUrl },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath(`/freelancers/${userId}`);
    return { success: true, avatarUrl: publicUrl };
  } catch (err: any) {
    console.error("updateAvatarAction:", err);
    return { error: err.message || "Failed to upload photo." };
  }
}

export async function removeAvatarAction() {
  try {
    const session = await auth();
    if (!session?.user || !(session.user as any).id) {
      return { error: "You must be logged in." };
    }
    const userId = (session.user as any).id as string;

    await deleteAvatar(userId);
    await prisma.user.update({
      where: { id: userId },
      data:  { avatarUrl: null },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath(`/freelancers/${userId}`);
    return { success: true };
  } catch (err: any) {
    console.error("removeAvatarAction:", err);
    return { error: err.message || "Failed to remove photo." };
  }
}
