import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyChapaTransaction } from "@/app/actions/payment";
import { TransactionStatus, JobStatus } from "@prisma/client";

/**
 * Chapa return_url callback — user lands here after completing (or cancelling)
 * the Chapa hosted checkout. We verify the transaction server-side before
 * updating the DB, so the URL param alone cannot be spoofed.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txRef  = searchParams.get("tx_ref");
  const status = searchParams.get("status"); // "success" | "failed" | "cancelled"

  if (!txRef) {
    return NextResponse.redirect(
      new URL("/dashboard?payment_error=missing_ref", request.url)
    );
  }

  // User cancelled on the Chapa page
  if (status === "cancelled" || status === "failed") {
    // Mark the pending transaction as FAILED
    await prisma.transaction.updateMany({
      where:  { chapaRef: txRef, status: "PENDING" },
      data:   { status: TransactionStatus.FAILED },
    });
    return NextResponse.redirect(
      new URL("/dashboard?payment_error=cancelled", request.url)
    );
  }

  try {
    // Server-side verification — never trust the URL param alone
    const verified = await verifyChapaTransaction(txRef);

    if (!verified) {
      return NextResponse.redirect(
        new URL("/dashboard?payment_error=verification_failed", request.url)
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: { chapaRef: txRef },
    });

    if (!transaction) {
      return NextResponse.redirect(
        new URL("/dashboard?payment_error=not_found", request.url)
      );
    }

    // Idempotent — skip if already processed
    if (transaction.status === TransactionStatus.COMPLETED) {
      return NextResponse.redirect(
        new URL("/dashboard?payment_success=true", request.url)
      );
    }

    // Mark transaction complete and job as IN_PROGRESS (escrow funded)
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data:  { status: TransactionStatus.COMPLETED },
      }),
      prisma.job.update({
        where: { id: transaction.jobId },
        data:  { status: JobStatus.IN_PROGRESS },
      }),
    ]);

    // Notify the client
    const job = await prisma.job.findUnique({ where: { id: transaction.jobId } });
    if (job) {
      await prisma.notification.create({
        data: {
          userId:  transaction.userId,
          title:   "Escrow Funded",
          content: `Your escrow payment of ETB ${transaction.amount.toLocaleString()} for "${job.title}" was successful. The job is now in progress.`,
          type:    "ESCROW",
        },
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard?payment_success=true", request.url)
    );
  } catch (err) {
    console.error("Chapa callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?payment_error=exception", request.url)
    );
  }
}
