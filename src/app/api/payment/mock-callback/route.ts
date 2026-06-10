import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, JobStatus } from "@prisma/client";

// ── Dev-only route — completely disabled in production ────────────────────────
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref");
  const status = searchParams.get("status");

  if (!txRef) {
    return NextResponse.redirect(new URL("/dashboard?payment_error=missing_ref", request.url));
  }

  try {
    if (status === "success") {
      const transaction = await prisma.transaction.findFirst({
        where: { chapaRef: txRef },
      });

      if (transaction && transaction.status === TransactionStatus.PENDING) {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.COMPLETED },
          }),
          prisma.job.update({
            where: { id: transaction.jobId },
            data: { status: JobStatus.IN_PROGRESS },
          }),
        ]);

        return NextResponse.redirect(new URL("/dashboard?payment_success=true", request.url));
      }
    }

    return NextResponse.redirect(new URL("/dashboard?payment_error=failed", request.url));
  } catch (err) {
    console.error("Mock callback error:", err);
    return NextResponse.redirect(new URL("/dashboard?payment_error=exception", request.url));
  }
}
