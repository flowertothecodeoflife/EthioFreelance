"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  Mail, Eye, EyeOff, Loader2, RefreshCw,
  ShieldCheck, CheckCircle, ArrowRight, KeyRound,
} from "lucide-react";
import { sendOtp, verifyOtp, resetPassword } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// 3 steps: 1 = enter email, 2 = enter OTP, 3 = set new password
type Step = 1 | 2 | 3;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const t = useTranslations("auth.forgotPassword");
  const [isPending, startTransition] = useTransition();

  const [step, setStep]               = useState<Step>(1);
  const [email, setEmail]             = useState("");
  const [otp, setOtp]                 = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await sendOtp(email, "PASSWORD_RESET");
      if (res.error) { setError(res.error); return; }
      setStep(2);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    });
  };

  const handleResend = () => {
    setError("");
    startTransition(async () => {
      const res = await sendOtp(email, "PASSWORD_RESET");
      if (res.error) { setError(res.error); return; }
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    });
  };

  // ── OTP input ───────────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) { setError(t("errors.otpIncomplete")); return; }
    setError("");
    startTransition(async () => {
      const res = await verifyOtp(email, code, "PASSWORD_RESET");
      if (res.error) {
        setError(res.error);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      setStep(3);
    });
  };

  // ── Reset password ──────────────────────────────────────────────────────────
  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      setError(t("errors.passwordShort"));
      return;
    }
    if (newPassword !== confirmPass) {
      setError(t("errors.passwordMismatch"));
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await resetPassword(email, newPassword);
      if (res.error) { setError(res.error); return; }
      router.push("/login?reset=success");
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">{t("title")}</h1>
        <p className="text-gray-500 text-sm">
          {step === 1 && t("sub")}
          {step === 2 && t("otpSub", { email })}
          {step === 3 && t("newPasswordHeading")}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`rounded-full transition-all ${
            step > s ? "w-6 h-2 bg-green-500" :
            step === s ? "w-6 h-2 bg-green-700" :
            "w-2 h-2 bg-gray-200"
          }`} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* ── Step 1: Enter email ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                {t("emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder={t("emailPlaceholder")}
                  className="w-full border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isPending}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("sending")}</>
                : <>{t("sendButton")} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        )}

        {/* ── Step 2: Enter OTP ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-green-700" />
              </div>
              <p className="text-sm text-gray-500">
                {t("otpHeading")} <strong className="text-gray-800">{email}</strong>
              </p>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block text-center">
                {t("otpLabel")}
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors ${
                      digit ? "border-green-400 bg-green-50 text-green-800" : "border-gray-200 text-gray-900"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isPending || otp.join("").length < 6}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("verifying")}</> : t("verifyButton")}
            </button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-gray-400">{t("resendCooldown", { seconds: resendCooldown })}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isPending}
                  className="text-sm text-green-700 hover:underline font-medium flex items-center gap-1 mx-auto disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t("resend")}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(["","","","","",""]); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← {t("backToLogin")}
            </button>
          </div>
        )}

        {/* ── Step 3: New password ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Identity verified for <strong>{email}</strong></p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                {t("newPasswordLabel")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder")}
                  className="w-full border border-gray-200 px-4 py-3 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                {t("confirmPasswordLabel")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className={`w-full border px-4 py-3 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                    confirmPass && confirmPass !== newPassword ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showConfirm ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              {confirmPass && confirmPass !== newPassword && (
                <p className="text-xs text-red-600 mt-1">{t("errors.passwordMismatch")}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isPending}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("resetting")}</>
                : t("resetButton")
              }
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t("rememberPassword")}{" "}
        <Link href="/login" className="text-green-700 font-semibold hover:underline">{t("signIn")}</Link>
      </p>
    </div>
  );
}
