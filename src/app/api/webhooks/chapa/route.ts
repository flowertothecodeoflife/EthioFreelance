import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, JobStatus } from "@prisma/client";
import * as crypto from "crypto";

const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET!;

/**
 * Chapa webhook — receives server-to-server payment events.
 * Signature verification is mandatory; unsigned requests are rejected.
 */
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    // ── Signature verification ──────────────────────────────────────────────
    const signature = request.headers.get("x-chapa-signature");

    if (!signature) {
      console.warn("Chapa webhook: missing signature header");
      return new NextResponse("Missing signature", { status: 401 });
    }

    const expected = crypto
      .createHmac("sha256", CHAPA_WEBHOOK_SECRET)
      .update(bodyText)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const sigBuffer      = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected,  "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      console.warn("Chapa webhook: invalid signature");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // ── Process payload ─────────────────────────────────────────────────────
    const payload = JSON.parse(bodyText);
    const { tx_ref, status, amount } = payload;

    if (!tx_ref) {
      return new NextResponse("Missing tx_ref", { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { chapaRef: tx_ref },
    });

    if (!transaction) {
      // Unknown transaction — acknowledge so Chapa doesn't retry
      return new NextResponse("Unknown transaction", { status: 200 });
    }

    // Idempotent
    if (transaction.status === TransactionStatus.COMPLETED) {
      return new NextResponse("Already processed", { status: 200 });
    }

    if (status === "success") {
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
            content: `Your Chapa payment of ETB ${transaction.amount.toLocaleString()} for "${job.title}" was confirmed. The job is now in progress.`,
            type:    "ESCROW",
          },
        });
      }

      return new NextResponse("OK", { status: 200 });
    }

    if (status === "failed") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data:  { status: TransactionStatus.FAILED },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("Chapa webhook error:", err);
    return new NextResponse(err.message || "Webhook error", { status: 500 });
  }
}
