"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  CreditCard, Smartphone, Loader2, AlertCircle,
  CheckCircle, ExternalLink, RefreshCw, Clock,
} from "lucide-react";
import { initializeEscrowPayment, queryMpesaStatus } from "@/app/actions/payment";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentSelectorProps {
  jobId:    string;
  jobTitle: string;
  amount:   number;          // ETB
  onSuccess?: () => void;
  onCancel?:  () => void;
}

type Provider = "chapa" | "mpesa";

type PayState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "mpesa_waiting"; checkoutRequestId: string; message: string }
  | { status: "mpesa_polling"; checkoutRequestId: string }
  | { status: "success" }
  | { status: "error"; message: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentSelector({
  jobId,
  jobTitle,
  amount,
  onSuccess,
  onCancel,
}: PaymentSelectorProps) {
  const [provider, setProvider]   = useState<Provider>("chapa");
  const [phone, setPhone]         = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [payState, setPayState]   = useState<PayState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  // Polling interval ref for M-Pesa status checks
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── M-Pesa polling ──────────────────────────────────────────────────────────
  const startPolling = (checkoutRequestId: string) => {
    setPayState({ status: "mpesa_polling", checkoutRequestId });
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 20 × 3s = 60s timeout

    pollRef.current = setInterval(async () => {
      attempts++;
      const res = await queryMpesaStatus(checkoutRequestId);

      if (res.error || attempts >= MAX_ATTEMPTS) {
        clearInterval(pollRef.current!);
        setPayState({
          status:  "error",
          message: attempts >= MAX_ATTEMPTS
            ? "Payment timed out. Please check your M-Pesa messages and try again."
            : res.error ?? "Failed to check payment status.",
        });
        return;
      }

      if (res.status === "completed") {
        clearInterval(pollRef.current!);
        setPayState({ status: "success" });
        onSuccess?.();
      } else if (res.status === "cancelled") {
        clearInterval(pollRef.current!);
        setPayState({ status: "error", message: "Payment was cancelled on your phone." });
      } else if (res.status === "timeout") {
        clearInterval(pollRef.current!);
        setPayState({ status: "error", message: "M-Pesa session timed out. Please try again." });
      }
      // status === "pending" → keep polling
    }, 3000);
  };

  // ── Phone validation ────────────────────────────────────────────────────────
  const validatePhone = (): boolean => {
    const cleaned = phone.replace(/\s+/g, "");
    if (!/^2547\d{8}$|^2541\d{8}$/.test(cleaned)) {
      setPhoneError("Enter a valid Safaricom number: 2547XXXXXXXX");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // ── Pay handler ─────────────────────────────────────────────────────────────
  const handlePay = () => {
    if (provider === "mpesa" && !validatePhone()) return;

    setPayState({ status: "pending" });

    startTransition(async () => {
      const res = await initializeEscrowPayment({
        jobId,
        amount,
        provider,
        phone: provider === "mpesa" ? phone.replace(/\s+/g, "") : undefined,
      });

      if (res.error) {
        setPayState({ status: "error", message: res.error });
        return;
      }

      if (provider === "chapa" && res.checkoutUrl) {
        // Redirect to Chapa hosted checkout
        window.location.href = res.checkoutUrl;
        return;
      }

      if (provider === "mpesa" && res.checkoutRequestId) {
        setPayState({
          status:            "mpesa_waiting",
          checkoutRequestId: res.checkoutRequestId,
          message:           res.message ?? "Check your phone and enter your M-Pesa PIN.",
        });
        // Start polling after a short delay to let Safaricom send the push
        setTimeout(() => startPolling(res.checkoutRequestId!), 5000);
      }
    });
  };

  const isLoading = isPending || payState.status === "pending";

  // ── Success state ───────────────────────────────────────────────────────────
  if (payState.status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <h3 className="font-bold text-green-800 text-base mb-1">Payment Successful</h3>
        <p className="text-green-700 text-sm">
          Escrow funded. The job is now in progress.
        </p>
      </div>
    );
  }

  // ── M-Pesa waiting / polling state ─────────────────────────────────────────
  if (
    payState.status === "mpesa_waiting" ||
    payState.status === "mpesa_polling"
  ) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
          <Smartphone className="w-7 h-7 text-green-700 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base mb-1">
            {payState.status === "mpesa_waiting"
              ? "STK Push Sent"
              : "Waiting for Confirmation"}
          </h3>
          <p className="text-sm text-gray-500">
            {payState.status === "mpesa_waiting"
              ? payState.message
              : "Checking payment status..."}
          </p>
        </div>
        {payState.status === "mpesa_polling" && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Polling every 3 seconds</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>This will time out after 60 seconds</span>
        </div>
        <button
          onClick={() => {
            if (pollRef.current) clearInterval(pollRef.current);
            setPayState({ status: "idle" });
          }}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Cancel and try again
        </button>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <h3 className="font-bold text-gray-900 text-base mb-0.5">Fund Escrow</h3>
        <p className="text-sm text-gray-500">
          Choose a payment method to secure{" "}
          <strong>ETB {amount.toLocaleString()}</strong> in escrow for this job.
        </p>
      </div>

      {/* Error banner */}
      {payState.status === "error" && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {payState.message}
            <button
              onClick={() => setPayState({ status: "idle" })}
              className="ml-2 text-red-400 hover:text-red-700 text-xs font-bold uppercase"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* Provider selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setProvider("chapa")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            provider === "chapa"
              ? "border-green-600 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <CreditCard
            className={`w-5 h-5 mb-2 ${
              provider === "chapa" ? "text-green-600" : "text-gray-400"
            }`}
          />
          <div className="font-semibold text-sm text-gray-900">Chapa</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Card, bank, telebirr & more
          </div>
        </button>

        <button
          type="button"
          onClick={() => setProvider("mpesa")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            provider === "mpesa"
              ? "border-green-600 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Smartphone
            className={`w-5 h-5 mb-2 ${
              provider === "mpesa" ? "text-green-600" : "text-gray-400"
            }`}
          />
          <div className="font-semibold text-sm text-gray-900">M-Pesa</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Lipa Na M-Pesa STK Push
          </div>
        </button>
      </div>

      {/* M-Pesa phone input */}
      {provider === "mpesa" && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Safaricom Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">
              +
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError("");
              }}
              placeholder="254712345678"
              className={`w-full border pl-7 pr-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 ${
                phoneError ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
          </div>
          {phoneError ? (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {phoneError}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Format: 2547XXXXXXXX (no + prefix, no spaces)
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Job</span>
          <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
            {jobTitle}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Escrow Amount</span>
          <span className="font-bold text-green-700">
            ETB {amount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Platform Fee</span>
          <span className="font-medium text-gray-700">
            ETB {(amount * 0.01).toLocaleString(undefined, { maximumFractionDigits: 2 })} (1%)
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="font-bold text-gray-900">
            ETB {(amount * 1.01).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Chapa info */}
      {provider === "chapa" && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          You'll be redirected to Chapa's secure checkout page.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handlePay}
          disabled={isLoading}
          className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {provider === "chapa" ? "Redirecting..." : "Sending STK Push..."}
            </>
          ) : (
            <>
              {provider === "chapa" ? (
                <><CreditCard className="w-4 h-4" /> Pay with Chapa</>
              ) : (
                <><Smartphone className="w-4 h-4" /> Pay with M-Pesa</>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
