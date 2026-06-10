import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TransactionStatus, JobStatus } from "@prisma/client";

/**
 * M-Pesa STK Push callback — Safaricom POSTs the result here after the user
 * completes (or cancels) the PIN prompt on their phone.
 *
 * Safaricom payload shape:
 * {
 *   Body: {
 *     stkCallback: {
 *       MerchantRequestID: string,
 *       CheckoutRequestID: string,
 *       ResultCode: number,       // 0 = success
 *       ResultDesc: string,
 *       CallbackMetadata?: {
 *         Item: Array<{ Name: string; Value: any }>
 *       }
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    // Find the transaction by CheckoutRequestID (stored in chapaRef field)
    const transaction = await prisma.transaction.findFirst({
      where: { chapaRef: CheckoutRequestID },
    });

    if (!transaction) {
      console.warn("M-Pesa callback: transaction not found for", CheckoutRequestID);
      // Still return 200 so Safaricom doesn't retry
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Idempotent — skip if already processed
    if (transaction.status === TransactionStatus.COMPLETED) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    if (ResultCode === 0) {
      // Extract M-Pesa receipt number from metadata
      const items: Array<{ Name: string; Value: any }> =
        CallbackMetadata?.Item ?? [];
      const receiptItem = items.find((i) => i.Name === "MpesaReceiptNumber");
      const receipt     = receiptItem?.Value as string | undefined;

      // Mark transaction complete and job as IN_PROGRESS
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status:   TransactionStatus.COMPLETED,
            // Store M-Pesa receipt in chapaRef for audit trail
            chapaRef: receipt ?? CheckoutRequestID,
          },
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
            title:   "M-Pesa Payment Confirmed",
            content: `Your M-Pesa payment of ETB ${transaction.amount.toLocaleString()} for "${job.title}" was successful.${receipt ? ` Receipt: ${receipt}` : ""}`,
            type:    "ESCROW",
          },
        });
      }
    } else {
      // Payment failed or was cancelled by user
      await prisma.transaction.update({
        where: { id: transaction.id },
        data:  { status: TransactionStatus.FAILED },
      });

      console.log(`M-Pesa payment failed: ${ResultDesc} (code ${ResultCode})`);
    }

    // Always return 200 — Safaricom retries on non-200
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err: any) {
    console.error("M-Pesa callback error:", err);
    // Return 200 to prevent Safaricom retry storms
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
