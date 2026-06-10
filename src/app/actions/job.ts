"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { JobType, JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createJob(data: {
  title: string;
  description: string;
  budget: number;
  type: "FIXED" | "HOURLY";
  location: string;
  category: string;
  skills: string[];
  milestones?: { title: string; amount: number; dueDate?: string; order: number }[];
}) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as any).id) {
      return { error: "You must be logged in to post a job." };
    }

    const clientId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: clientId } });

    if (!user || user.role !== "CLIENT") {
      return { error: "Only client accounts can post jobs." };
    }

    const { title, description, budget, type, location, category, skills, milestones } = data;

    if (!title || !description || !budget || !location || !category) {
      return { error: "Missing required fields." };
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget: parseFloat(budget as any),
        type: type === "HOURLY" ? JobType.HOURLY : JobType.FIXED,
        location,
        category,
        skills,
        clientId,
        // Create milestones in same transaction
        ...(milestones && milestones.length > 0 && milestones.some(m => m.title.trim()) ? {
          milestones: {
            create: milestones
              .filter(m => m.title.trim())
              .map((m, i) => ({
                title:   m.title.trim(),
                amount:  m.amount || 0,
                dueDate: m.dueDate || null,
                order:   m.order ?? i,
              })),
          },
        } : {}),
      },
    });

    revalidatePath("/jobs");
    revalidatePath("/dashboard");
    return { success: true, jobId: job.id };
  } catch (err: any) {
    console.error("Create job error:", err);
    return { error: err.message || "Something went wrong." };
  }
}

export async function getJobs(filters?: {
  search?: string;
  category?: string;
  type?: "FIXED" | "HOURLY";
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
}) {
  try {
    const where: any = {
      status: JobStatus.OPEN,
    };

    if (filters) {
      const { search, category, type, minBudget, maxBudget, skills } = filters;

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      if (category && category !== "All Categories") {
        where.category = category;
      }

      if (type) {
        where.type = type;
      }

      if (minBudget !== undefined || maxBudget !== undefined) {
        where.budget = {};
        if (minBudget !== undefined) {
          where.budget.gte = parseFloat(minBudget as any);
        }
        if (maxBudget !== undefined) {
          where.budget.lte = parseFloat(maxBudget as any);
        }
      }

      if (skills && skills.length > 0) {
        where.skills = {
          hasSome: skills,
        };
      }
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: {
          select: {
            name: true,
            kycStatus: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    });

    return { success: true, jobs };
  } catch (err: any) {
    console.error("Get jobs error:", err);
    return { error: err.message || "Failed to fetch jobs." };
  }
}

export async function getJobById(id: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            kycStatus: true,
          },
        },
        milestones: {
          orderBy: { order: "asc" },
        },
        proposals: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                profile: true,
              },
            },
            attachments: true,
          },
        },
      },
    });

    if (!job) {
      return { error: "Job not found." };
    }

    return { success: true, job };
  } catch (err: any) {
    console.error("Get job details error:", err);
    return { error: err.message || "Failed to fetch job details." };
  }
}
