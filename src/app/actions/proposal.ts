"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ProposalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function submitProposal(data: {
  jobId: string;
  bidAmount: number;
  coverLetter: string;
  attachments?: { url: string; name: string; size: number }[];
}) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as any).id) {
      return { error: "You must be logged in to submit a proposal." };
    }

    const freelancerId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: freelancerId } });

    if (!user || user.role !== "FREELANCER") {
      return { error: "Only freelancers can submit proposals." };
    }

    const { jobId, bidAmount, coverLetter, attachments } = data;

    if (!jobId || !bidAmount || !coverLetter) {
      return { error: "Missing required fields." };
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return { error: "Job not found." };
    if (job.status !== "OPEN") return { error: "This job is no longer accepting proposals." };

    const existing = await prisma.proposal.findFirst({ where: { jobId, freelancerId } });
    if (existing) return { error: "You have already submitted a proposal for this job." };

    const proposal = await prisma.proposal.create({
      data: {
        jobId,
        freelancerId,
        bidAmount: parseFloat(bidAmount as any),
        coverLetter,
        ...(attachments && attachments.length > 0 ? {
          attachments: {
            create: attachments.map(a => ({ url: a.url, name: a.name, size: a.size })),
          },
        } : {}),
      },
      include: { attachments: true },
    });

    // Notify the client
    await prisma.notification.create({
      data: {
        userId:  job.clientId,
        title:   "New Proposal Received",
        content: `${user.name} submitted a proposal for "${job.title}" — ETB ${bidAmount.toLocaleString()}.`,
        type:    "PROPOSAL",
      },
    });

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard");
    return { success: true, proposalId: proposal.id };
  } catch (err: any) {
    console.error("Submit proposal error:", err);
    return { error: err.message || "Failed to submit proposal." };
  }
}

export async function withdrawProposal(proposalId: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as any).id) {
      return { error: "You must be logged in." };
    }

    const freelancerId = (session.user as any).id;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: { select: { id: true, title: true, status: true, clientId: true } } },
    });

    if (!proposal) return { error: "Proposal not found." };
    if (proposal.freelancerId !== freelancerId) return { error: "You can only withdraw your own proposals." };
    if (proposal.status === "ACCEPTED") return { error: "You cannot withdraw an accepted proposal." };
    if (proposal.withdrawnAt) return { error: "This proposal has already been withdrawn." };
    if (proposal.job.status !== "OPEN") return { error: "This job is no longer open." };

    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status:      "PENDING", // keep original status; withdrawnAt flags it as withdrawn
        withdrawnAt: new Date(),
      },
    });

    // Notify the client
    await prisma.notification.create({
      data: {
        userId:  proposal.job.clientId,
        title:   "Proposal Withdrawn",
        content: `A freelancer has withdrawn their proposal for "${proposal.job.title}".`,
        type:    "PROPOSAL",
      },
    });

    revalidatePath(`/jobs/${proposal.job.id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Withdraw proposal error:", err);
    return { error: err.message || "Failed to withdraw proposal." };
  }
}

export async function updateProposalStatus(
  proposalId: string,
  status: "ACCEPTED" | "REJECTED" | "SHORTLISTED" | "PENDING"
) {
  try {
    const session = await auth();
    if (!session || !session.user || !(session.user as any).id) {
      return { error: "Unauthorized" };
    }

    const userId = (session.user as any).id;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) return { error: "Proposal not found." };
    if (proposal.job.clientId !== userId) return { error: "Only the job owner can manage proposals." };

    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: status as ProposalStatus },
    });

    // Notify the freelancer of the status change
    await prisma.notification.create({
      data: {
        userId:  proposal.freelancerId,
        title:
          status === "ACCEPTED"
            ? "🎉 Proposal Accepted!"
            : status === "REJECTED"
            ? "Proposal Update"
            : "Proposal Shortlisted",
        content:
          status === "ACCEPTED"
            ? `Your proposal for "${proposal.job.title}" has been accepted. The client will fund escrow to get started.`
            : status === "REJECTED"
            ? `Your proposal for "${proposal.job.title}" was not selected this time.`
            : `Your proposal for "${proposal.job.title}" has been shortlisted by the client.`,
        type: "PROPOSAL",
      },
    });

    if (status === "ACCEPTED") {
      await prisma.job.update({
        where: { id: proposal.jobId },
        data: { status: "IN_PROGRESS" },
      });
    }

    revalidatePath(`/jobs/${proposal.jobId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Update proposal error:", err);
    return { error: err.message || "Failed to update proposal status." };
  }
}
