"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import * as crypto from "crypto";

// ─── Env ──────────────────────────────────────────────────────────────────────

const CHAPA_SECRET_KEY      = process.env.CHAPA_SECRET_KEY!;
const CHAPA_ENCRYPTION_KEY  = process.env.CHAPA_ENCRYPTION_KEY!;
const BASE_URL              = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const MPESA_CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_SHORTCODE       = process.env.MPESA_SHORTCODE || "174379";
const MPESA_PASSKEY         = process.env.MPESA_PASSKEY!;
// Daraja sandbox base URL — swap to https://api.safaricom.co.ke for production
const MPESA_BASE_URL        = "https://sandbox.safaricom.co.ke";

// ─── Shared auth guard ────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session?.user || !(session.user as any).id) {
    throw new Error("You must be logged in to make a payment.");
  }
  return session.user as any;
}

// ─── Chapa helpers ────────────────────────────────────────────────────────────

/**
 * Calls the Chapa initialize endpoint and returns the hosted checkout URL.
 * Docs: https://developer.chapa.co/docs/accept-payments
 */
async function chapaInitialize(params: {
  amount: number;
  txRef: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
}): Promise<{ checkoutUrl: string }> {
  const body = {
    amount:        params.amount.toString(),
    currency:      "ETB",
    email:         params.email,
    first_name:    params.firstName,
    last_name:     params.lastName,
    tx_ref:        params.txRef,
    callback_url:  `${BASE_URL}/api/webhooks/chapa`,
    return_url:    `${BASE_URL}/api/payment/chapa-callback?tx_ref=${params.txRef}`,
    customization: {
      title:       "EthioFreelance Escrow",
      description: `Escrow deposit for: ${params.jobTitle}`,
    },
  };

  const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chapa initialize failed: ${err}`);
  }

  const json = await res.json();

  if (json.status !== "success" || !json.data?.checkout_url) {
    throw new Error(json.message || "Chapa did not return a checkout URL.");
  }

  return { checkoutUrl: json.data.checkout_url };
}

/**
 * Verifies a completed Chapa transaction by calling the verify endpoint.
 * Returns true if the transaction is confirmed successful.
 */
export async function verifyChapaTransaction(txRef: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
      {
        headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return false;

    const json = await res.json();
    return json.status === "success" && json.data?.status === "success";
  } catch {
    return false;
  }
}

// ─── M-Pesa helpers ───────────────────────────────────────────────────────────

/**
 * Fetches a short-lived OAuth2 access token from Safaricom Daraja.
 */
async function getMpesaToken(): Promise<string> {
  const credentials = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`M-Pesa token fetch failed: ${err}`);
  }

  const json = await res.json();
  if (!json.access_token) throw new Error("M-Pesa did not return an access token.");
  return json.access_token;
}

/**
 * Generates the Base64-encoded password required by the STK Push endpoint.
 * Format: Base64(shortcode + passkey + timestamp)
 */
function getMpesaPassword(timestamp: string): string {
  return Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");
}

/**
 * Initiates an M-Pesa STK Push (Lipa Na M-Pesa Online).
 * The user receives a PIN prompt on their phone.
 * Amount is converted from ETB to KES (approximate 1:1 for sandbox testing).
 */
async function mpesaStkPush(params: {
  phone: string;   // format: 2547XXXXXXXX
  amount: number;  // in ETB — treated as KES for sandbox
  txRef: string;
  jobTitle: string;
}): Promise<{ checkoutRequestId: string }> {
  const token     = await getMpesaToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14); // YYYYMMDDHHmmss

  const password  = getMpesaPassword(timestamp);

  // M-Pesa requires whole numbers, minimum 1 KES
  const amount = Math.max(1, Math.round(params.amount));

  const body = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   "CustomerPayBillOnline",
    Amount:            amount,
    PartyA:            params.phone,
    PartyB:            MPESA_SHORTCODE,
    PhoneNumber:       params.phone,
    CallBackURL:       `${BASE_URL}/api/payment/mpesa-callback`,
    AccountReference:  params.txRef.slice(0, 12), // max 12 chars
    TransactionDesc:   `Escrow: ${params.jobTitle}`.slice(0, 13), // max 13 chars
  };

  const res = await fetch(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`M-Pesa STK Push failed: ${err}`);
  }

  const json = await res.json();

  if (json.ResponseCode !== "0") {
    throw new Error(json.ResponseDescription || "M-Pesa STK Push was rejected.");
  }

  return { checkoutRequestId: json.CheckoutRequestID };
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function initializeEscrowPayment(data: {
  jobId:    string;
  amount:   number;
  provider: "chapa" | "mpesa";
  phone?:   string; // required for M-Pesa, format: 2547XXXXXXXX
}) {
  try {
    const user = await requireSession();
    const userId = user.id as string;

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) return { error: "User not found." };

    const { jobId, amount, provider, phone } = data;

    if (!jobId || !amount || amount <= 0) {
      return { error: "Missing or invalid job ID / amount." };
    }

    if (provider === "mpesa" && !phone) {
      return { error: "Phone number is required for M-Pesa payments." };
    }

    // Validate phone format for M-Pesa (2547XXXXXXXX or 2541XXXXXXXX)
    if (provider === "mpesa" && phone) {
      const cleaned = phone.replace(/\s+/g, "");
      if (!/^2547\d{8}$|^2541\d{8}$/.test(cleaned)) {
        return {
          error:
            "Invalid phone number. Use format 2547XXXXXXXX (e.g. 254712345678).",
        };
      }
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return { error: "Job not found." };

    // Generate a unique transaction reference
    const txRef = `ef-${provider}-${jobId.slice(-6)}-${Date.now()}`;

    // Create a PENDING transaction record before hitting the payment gateway
    // so we have a record even if the gateway call fails
    await prisma.transaction.create({
      data: {
        amount:   parseFloat(amount as any),
        type:     TransactionType.ESCROW_DEPOSIT,
        status:   TransactionStatus.PENDING,
        chapaRef: txRef,
        jobId,
        userId,
      },
    });

    // ── Chapa ──────────────────────────────────────────────────────────────────
    if (provider === "chapa") {
      const nameParts = dbUser.name.split(" ");
      const firstName = nameParts[0] ?? "User";
      const lastName  = nameParts.slice(1).join(" ") || firstName;

      const { checkoutUrl } = await chapaInitialize({
        amount,
        txRef,
        email:     dbUser.email,
        firstName,
        lastName,
        jobTitle:  job.title,
      });

      return { success: true, provider: "chapa", checkoutUrl, txRef };
    }

    // ── M-Pesa ─────────────────────────────────────────────────────────────────
    if (provider === "mpesa") {
      const cleanPhone = phone!.replace(/\s+/g, "");

      const { checkoutRequestId } = await mpesaStkPush({
        phone:    cleanPhone,
        amount,
        txRef,
        jobTitle: job.title,
      });

      // Store the M-Pesa CheckoutRequestID in chapaRef field for callback lookup
      await prisma.transaction.updateMany({
        where: { chapaRef: txRef },
        data:  { chapaRef: checkoutRequestId },
      });

      return {
        success:          true,
        provider:         "mpesa",
        checkoutRequestId,
        txRef,
        message:
          "STK Push sent. Check your phone and enter your M-Pesa PIN to complete payment.",
      };
    }

    return { error: "Invalid payment provider." };
  } catch (err: any) {
    console.error("initializeEscrowPayment error:", err);
    return { error: err.message || "Failed to initialize payment." };
  }
}

// ─── Query M-Pesa STK Push status ─────────────────────────────────────────────
// Called by the client to poll whether the user completed the PIN prompt.

export async function queryMpesaStatus(checkoutRequestId: string) {
  try {
    const token     = await getMpesaToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const password = getMpesaPassword(timestamp);

    const res = await fetch(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password:          password,
          Timestamp:         timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
      }
    );

    if (!res.ok) return { error: "Failed to query M-Pesa status." };

    const json = await res.json();

    // ResultCode 0 = success, 1032 = cancelled by user, 1037 = timeout
    if (json.ResultCode === "0" || json.ResultCode === 0) {
      return { success: true, status: "completed" };
    }
    if (json.ResultCode === "1032" || json.ResultCode === 1032) {
      return { success: true, status: "cancelled" };
    }
    if (json.ResultCode === "1037" || json.ResultCode === 1037) {
      return { success: true, status: "timeout" };
    }

    return { success: true, status: "pending" };
  } catch (err: any) {
    return { error: err.message || "Failed to query M-Pesa status." };
  }
}

// ─── releaseEscrowPayment ─────────────────────────────────────────────────────
// Called by the CLIENT from the dashboard to release escrow to the freelancer.
// Finds the accepted proposal, marks the transaction complete, updates the job,
// increments the freelancer's completedJobs, and notifies both parties.

export async function releaseEscrowPayment(jobId: string) {
  try {
    const user = await requireSession();
    const userId = user.id as string;

    if (!jobId) return { error: "Job ID is required." };

    // Verify the caller owns this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        proposals: {
          where: { status: "ACCEPTED" },
          include: {
            freelancer: {
              select: { id: true, name: true },
            },
          },
          take: 1,
        },
        transactions: {
          where: {
            type: TransactionType.ESCROW_DEPOSIT,
            status: TransactionStatus.COMPLETED,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!job) return { error: "Job not found." };
    if (job.clientId !== userId) return { error: "Only the job owner can release escrow." };
    if (job.status !== "IN_PROGRESS") return { error: "Job must be In Progress to release escrow." };

    const fundedTransaction = job.transactions[0];
    if (!fundedTransaction) {
      return { error: "No funded escrow transaction found for this job. Please fund escrow first." };
    }

    const acceptedProposal = job.proposals[0];
    if (!acceptedProposal) {
      return { error: "No accepted proposal found. Accept a proposal before releasing payment." };
    }

    const freelancerId = acceptedProposal.freelancer.id;
    const releaseAmount = fundedTransaction.amount;

    // Atomic DB update
    await prisma.$transaction([
      // 1. Create the ESCROW_RELEASE transaction record
      prisma.transaction.create({
        data: {
          amount:   releaseAmount,
          type:     TransactionType.ESCROW_RELEASE,
          status:   TransactionStatus.COMPLETED,
          chapaRef: `release-${fundedTransaction.chapaRef ?? jobId}-${Date.now()}`,
          jobId,
          userId:   freelancerId, // credited to the freelancer
        },
      }),
      // 2. Mark the job as COMPLETED
      prisma.job.update({
        where: { id: jobId },
        data:  { status: "COMPLETED" },
      }),
    ]);

    // 3. Increment freelancer's completedJobs and update rating
    await prisma.freelancerProfile.updateMany({
      where: { userId: freelancerId },
      data: {
        completedJobs: { increment: 1 },
        // Simple rating bump toward 5.0 — real rating would come from a review
        rating: { increment: 0 },
      },
    });

    // 4. Notify the freelancer
    await prisma.notification.create({
      data: {
        userId:  freelancerId,
        title:   "Payment Released 🎉",
        content: `ETB ${releaseAmount.toLocaleString()} has been released to you for "${job.title}". Great work!`,
        type:    "ESCROW",
      },
    });

    // 5. Notify the client
    await prisma.notification.create({
      data: {
        userId:  userId,
        title:   "Escrow Released",
        content: `You released ETB ${releaseAmount.toLocaleString()} to ${acceptedProposal.freelancer.name} for "${job.title}". Job marked as completed.`,
        type:    "ESCROW",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (err: any) {
    console.error("releaseEscrowPayment error:", err);
    return { error: err.message || "Failed to release escrow." };
  }
}
