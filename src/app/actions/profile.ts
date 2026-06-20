"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateFreelancerProfile(data: {
  title?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
}) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as any).id) {
      return { error: "You must be logged in to update your profile." };
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== "FREELANCER") {
      return { error: "Only freelancers have profile settings." };
    }

    const { title, bio, skills, hourlyRate } = data;

    const profile = await prisma.freelancerProfile.upsert({
      where: { userId },
      update: {
        ...(title !== undefined && { title }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate as any) }),
      },
      create: {
        userId,
        title: title || "Freelancer",
        bio: bio || "",
        skills: skills || [],
        hourlyRate: hourlyRate ? parseFloat(hourlyRate as any) : 0,
      },
    });

    revalidatePath("/profile");
    revalidatePath(`/freelancers/${userId}`);
    return { success: true, profile };
  } catch (err: any) {
    console.error("Update profile error:", err);
    return { error: err.message || "Failed to update profile." };
  }
}

export async function getFreelancers(filters?: {
  search?: string;
  skills?: string[];
  minRate?: number;
  maxRate?: number;
}) {
  try {
    const where: any = {
      role: "FREELANCER",
    };

    if (filters) {
      const { search, skills, minRate, maxRate } = filters;

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { profile: { title: { contains: search, mode: "insensitive" } } },
        ];
      }

      // Build profile filter carefully to avoid overwriting previous conditions
      const profileFilter: any = {};

      if (skills && skills.length > 0) {
        profileFilter.skills = { hasSome: skills };
      }

      if (minRate !== undefined || maxRate !== undefined) {
        profileFilter.hourlyRate = {};
        if (minRate !== undefined) profileFilter.hourlyRate.gte = parseFloat(minRate as any);
        if (maxRate !== undefined) profileFilter.hourlyRate.lte = parseFloat(maxRate as any);
      }

      if (Object.keys(profileFilter).length > 0) {
        where.profile = profileFilter;
      }
    }

    const freelancers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        isOnline: true,
        profile: {
          select: {
            title: true,
            bio: true,
            skills: true,
            hourlyRate: true,
            rating: true,
            completedJobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, freelancers };
  } catch (err: any) {
    console.error("Get freelancers error:", err);
    return { error: err.message || "Failed to fetch freelancers." };
  }
}

export async function getFreelancerProfile(userId: string) {
  try {
    const freelancer = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "FREELANCER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        kycStatus: true,
        avatarUrl: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!freelancer) {
      return { error: "Freelancer profile not found." };
    }

    return { success: true, freelancer };
  } catch (err: any) {
    console.error("Get freelancer details error:", err);
    return { error: err.message || "Failed to fetch freelancer profile details." };
  }
}

export async function updateClientProfile(data: {
  name?: string;
  phone?: string;
}) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as any).id) {
      return { error: "You must be logged in to update your profile." };
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== "CLIENT") {
      return { error: "Only clients can use this action." };
    }

    const { name, phone } = data;

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() || null }),
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Update client profile error:", err);
    return { error: err.message || "Failed to update profile." };
  }
}
