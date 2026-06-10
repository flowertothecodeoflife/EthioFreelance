"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { KycStatus, JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Admin routes use a cookie-based session (separate from NextAuth).
// Every action verifies this before touching the DB.

async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "authenticated") {
    throw new Error("Unauthorized: admin session required.");
  }
}

// ─── getUsers ─────────────────────────────────────────────────────────────────

export async function getUsers() {
  try {
    await requireAdminSession();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        kycStatus: true,
        isOnline: true,
        createdAt: true,
        _count: {
          select: {
            jobs: true,        // jobs posted (clients)
            proposals: true,   // proposals submitted (freelancers)
          },
        },
      },
    });

    return { success: true, users };
  } catch (err: any) {
    console.error("getUsers error:", err);
    return { error: err.message || "Failed to fetch users." };
  }
}

// ─── updateKycStatus ──────────────────────────────────────────────────────────

export async function updateKycStatus(
  userId: string,
  status: "APPROVED" | "REJECTED" | "PENDING" | "NONE"
) {
  try {
    await requireAdminSession();

    if (!userId) return { error: "User ID is required." };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found." };

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: status as KycStatus },
    });

    // Notify the user of the KYC decision
    const notifContent =
      status === "APPROVED"
        ? "Your identity has been verified. Your profile is now fully trusted on EthioFreelance."
        : status === "REJECTED"
        ? "Your KYC submission was rejected. Please re-submit with a valid National ID."
        : "Your KYC status has been updated by an administrator.";

    await prisma.notification.create({
      data: {
        userId,
        title: `KYC ${status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Updated"}`,
        content: notifContent,
        type: "KYC",
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("updateKycStatus error:", err);
    return { error: err.message || "Failed to update KYC status." };
  }
}

// ─── deleteUser ───────────────────────────────────────────────────────────────
// Hard delete — all related records cascade automatically (see schema).

export async function deleteUser(userId: string) {
  try {
    await requireAdminSession();

    if (!userId) return { error: "User ID is required." };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found." };

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteUser error:", err);
    return { error: err.message || "Failed to delete user." };
  }
}

// ─── getAllJobs ───────────────────────────────────────────────────────────────

export async function getAllJobs() {
  try {
    await requireAdminSession();

    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, email: true, kycStatus: true },
        },
        _count: {
          select: { proposals: true },
        },
      },
    });

    return { success: true, jobs };
  } catch (err: any) {
    console.error("getAllJobs error:", err);
    return { error: err.message || "Failed to fetch jobs." };
  }
}

// ─── updateJobStatus ──────────────────────────────────────────────────────────

export async function updateJobStatus(
  jobId: string,
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  try {
    await requireAdminSession();

    if (!jobId) return { error: "Job ID is required." };

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return { error: "Job not found." };

    await prisma.job.update({
      where: { id: jobId },
      data: { status: status as JobStatus },
    });

    // Notify the job owner of the status change
    const notifContent =
      status === "CANCELLED"
        ? `Your job "${job.title}" has been cancelled by an administrator.`
        : status === "OPEN"
        ? `Your job "${job.title}" has been reopened by an administrator.`
        : `Your job "${job.title}" status has been updated to ${status.replace("_", " ").toLowerCase()}.`;

    await prisma.notification.create({
      data: {
        userId: job.clientId,
        title: `Job ${status === "CANCELLED" ? "Cancelled" : status === "OPEN" ? "Reopened" : "Updated"}`,
        content: notifContent,
        type: "JOB",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateJobStatus error:", err);
    return { error: err.message || "Failed to update job status." };
  }
}

// ─── getDashboardStats ────────────────────────────────────────────────────────
// All counts run in a single Promise.all — one round trip to the DB.

export async function getDashboardStats() {
  try {
    await requireAdminSession();

    const [
      totalUsers,
      totalFreelancers,
      totalClients,
      pendingKyc,
      activeJobs,
      completedJobs,
      cancelledJobs,
      totalProposals,
      pendingTransactions,
      completedTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "FREELANCER" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { kycStatus: "PENDING" } }),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.job.count({ where: { status: "CANCELLED" } }),
      prisma.proposal.count(),
      prisma.transaction.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const gmv            = completedTransactions._sum.amount  ?? 0;
    const escrowPending  = pendingTransactions._sum.amount    ?? 0;
    const txCompleted    = completedTransactions._count        ?? 0;
    const txPending      = pendingTransactions._count          ?? 0;

    return {
      success: true,
      stats: {
        // Users
        totalUsers,
        totalFreelancers,
        totalClients,
        pendingKyc,
        // Jobs
        activeJobs,
        completedJobs,
        cancelledJobs,
        totalProposals,
        // Payments
        gmv,
        escrowPending,
        txCompleted,
        txPending,
        // Disputes (no model yet)
        openDisputes: 0,
      },
    };
  } catch (err: any) {
    console.error("getDashboardStats error:", err);
    return { error: err.message || "Failed to fetch stats." };
  }
}

// ─── getAllTransactions ───────────────────────────────────────────────────────

export async function getAllTransactions() {
  try {
    await requireAdminSession();

    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        job: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    return { success: true, transactions };
  } catch (err: any) {
    console.error("getAllTransactions error:", err);
    return { error: err.message || "Failed to fetch transactions." };
  }
}

// ─── releaseEscrow ────────────────────────────────────────────────────────────
// Converts a PENDING ESCROW_DEPOSIT into an ESCROW_RELEASE + COMPLETED.
// Also marks the related job as COMPLETED and notifies both parties.

export async function releaseEscrow(transactionId: string) {
  try {
    await requireAdminSession();

    if (!transactionId) return { error: "Transaction ID is required." };

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        job: {
          include: {
            proposals: {
              where: { status: "ACCEPTED" },
              include: { freelancer: { select: { id: true, name: true } } },
              take: 1,
            },
          },
        },
        user: { select: { id: true, name: true } },
      },
    });

    if (!tx) return { error: "Transaction not found." };
    if (tx.status === "COMPLETED") return { error: "Escrow already released." };
    if (tx.type !== "ESCROW_DEPOSIT") {
      return { error: "Only escrow deposits can be released." };
    }

    // Update transaction: type → ESCROW_RELEASE, status → COMPLETED
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        type: "ESCROW_RELEASE",
        status: "COMPLETED",
      },
    });

    // Mark the job as COMPLETED
    await prisma.job.update({
      where: { id: tx.jobId },
      data: { status: "COMPLETED" },
    });

    // Notify the client (job owner)
    await prisma.notification.create({
      data: {
        userId: tx.userId,
        title: "Escrow Released",
        content: `Payment of ETB ${tx.amount.toLocaleString()} for "${tx.job.title}" has been released by admin.`,
        type: "ESCROW",
      },
    });

    // Notify the accepted freelancer if one exists
    const acceptedProposal = tx.job.proposals[0];
    if (acceptedProposal) {
      await prisma.notification.create({
        data: {
          userId: acceptedProposal.freelancer.id,
          title: "Payment Released",
          content: `ETB ${tx.amount.toLocaleString()} for "${tx.job.title}" has been released to you.`,
          type: "ESCROW",
        },
      });

      // Increment freelancer's completedJobs count
      await prisma.freelancerProfile.updateMany({
        where: { userId: acceptedProposal.freelancer.id },
        data: { completedJobs: { increment: 1 } },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("releaseEscrow error:", err);
    return { error: err.message || "Failed to release escrow." };
  }
}
