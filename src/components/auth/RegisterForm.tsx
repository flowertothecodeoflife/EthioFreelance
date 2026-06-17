"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Mail, User, Briefcase, CheckCircle,
  ArrowRight, Loader2, RefreshCw, ShieldCheck,
  Code2, Palette, PenTool, Building2, MapPin,
} from "lucide-react";
import { registerUser, sendOtp, verifyOtp } from "@/app/actions/auth";
import { signIn } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";
import { useTranslations } from "next-intl";

// ─── Role config — everything that differs between client and freelancer ──────

const ROLE_CONFIG = {
  freelancer: {
    label:       "I'm a Freelancer",
    icon:        User,
    accent:      "bg-blue-700",
    headline:    "Start Earning Today",
    sub:         "Showcase your skills and get hired by top Ethiopian companies.",
    badgeColor:  "bg-blue-50 border-blue-200 text-blue-800",
    badges:      ["Find paid work", "Build your portfolio", "Get paid securely"],
    phonePlaceholder: "9XX XXX XXX",
    phoneLabel:  "Phone Number (optional)",
    extraLabel:  "Primary Skill / Title",
    extraPlaceholder: "e.g. Full Stack Developer, Graphic Designer…",
    summaryRole: "Freelancer Account",
  },
  client: {
    label:       "I'm a Client",
    icon:        Briefcase,
    accent:      "bg-green-700",
    headline:    "Hire Top Talent",
    sub:         "Post jobs and connect with verified Ethiopian freelancers instantly.",
    badgeColor:  "bg-green-50 border-green-200 text-green-800",
    badges:      ["Post unlimited jobs", "Review proposals", "Pay via Chapa escrow"],
    phonePlaceholder: "9XX XXX XXX",
    phoneLabel:  "Business Phone (optional)",
    extraLabel:  "Company / Organisation Name",
    extraPlaceholder: "e.g. TechEthio Solutions, UNICEF Ethiopia…",
    summaryRole: "Client Account",
  },
} as const;

type Role = "client" | "freelancer";

interface Props {
  initialRole?: Role;
}

export default function RegisterForm({ initialRole = "freelancer" }: Props) {
  const t = useTranslations("auth.register");
  const router                           = useRouter();
  const [isPending, startTransition]     = useTransition();
  const [role, setRole]                  = useState<Role>(initialRole);
  const [step, setStep]                  = useState(1);
  const [showPass, setShowPass]          = useState(false);
  const [error, setError]                = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", password: "", extra: "", agreeTerms: false,
  });

  // OTP state
  const [otpVerified, setOtpVerified]         = useState(false);
  const [otp, setOtp]                         = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown]   = useState(0);
  const inputRefs                             = useRef<(HTMLInputElement | null)[]>([]);

  const cfg = ROLE_CONFIG[role];
  const update = (f: string, v: string | boolean) => setForm(p => ({ ...p, [f]: v }));

  // Sync URL when role changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("role", role);
    window.history.replaceState({}, "", url.toString());
  }, [role]);

  // Reset OTP state when role changes (different accounts)
  const handleRoleSwitch = (r: Role) => {
    setRole(r);
    setStep(1);
    setOtpVerified(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError(t("errors.fillRequired")); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t("errors.invalidEmail")); return false;
    }
    if (form.password.length < 8) {
      setError(t("errors.passwordShort")); return false;
    }
    setError(""); return true;
  };

  // ── OTP helpers ───────────────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(60);
    const iv = setInterval(() => setResendCooldown(c => {
      if (c <= 1) { clearInterval(iv); return 0; }
      return c - 1;
    }), 1000);
  };

  const doSendOtp = async () => {
    const res = await sendOtp(form.email, "EMAIL_VERIFY");
    if (res.error) { setError(res.error); return false; }
    startCooldown();
    return true;
  };

  const handleStep1Continue = () => {
    if (!validateStep1()) return;
    startTransition(async () => {
      const ok = await doSendOtp();
      if (ok) setStep(2);
    });
  };

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { setOtp(p.split("")); inputRefs.current[5]?.focus(); }
  };

  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) { setError(t("errors.otpIncomplete")); return; }
    setError("");
    startTransition(async () => {
      const res = await verifyOtp(form.email, code, "EMAIL_VERIFY");
      if (res.error) {
        setError(res.error);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      setOtpVerified(true);
    });
  };

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleCreateAccount = () => {
    if (!form.agreeTerms) { setError(t("errors.agreeTerms")); return; }
    if (!otpVerified) { setError(t("errors.verifyFirst")); return; }
    setError("");
    startTransition(async () => {
      const res = await registerUser({ ...form, role });
      if (res?.error) { setError(res.error); return; }
      const login = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (login?.error) { router.push("/login"); }
      else { router.push("/dashboard"); router.refresh(); }
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── Left panel — role-specific illustration ── */}
      <div className={`hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10 text-white ${cfg.accent}`}>
        <div>
          <div className="mb-12">
            <BrandLogo variant="horizontal-transparent" size={64} surface="dark" linkClassName="drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-bold mb-3">{role === "freelancer" ? t("freelancer.headline") : t("client.headline")}</h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">{role === "freelancer" ? t("freelancer.sub") : t("client.sub")}</p>
          <div className="space-y-3">
            {(role === "freelancer"
              ? [t("freelancer.badges.b1"), t("freelancer.badges.b2"), t("freelancer.badges.b3")]
              : [t("client.badges.b1"), t("client.badges.b2"), t("client.badges.b3")]
            ).map(b => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-white/80 flex-shrink-0" />
                <span className="text-sm text-white/90">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/40 text-xs">
          {t("etBuilt")}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-start py-10 px-4 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <BrandLogo variant="circular" size={80} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">{t("title")}</h1>
          <p className="text-gray-500 text-sm text-center mb-6">{t("sub")}</p>

          {/* ── Role toggle ── */}
          <div className="flex bg-gray-100 rounded-2xl p-1.5 gap-1 mb-6">
            {(["freelancer", "client"] as Role[]).map(r => {
              const c = ROLE_CONFIG[r];
              const Icon = c.icon;
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? r === "freelancer"
                        ? "bg-blue-700 text-white shadow-md"
                        : "bg-green-700 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {r === "freelancer" ? t("roleFreelancer") : t("roleClient")}
                </button>
              );
            })}
          </div>

          {/* Role description badge */}
          <div className={`border rounded-xl px-4 py-3 mb-6 text-sm ${cfg.badgeColor}`}>
            <strong>{role === "freelancer" ? t("roleFreelancer") : t("roleClient")}:</strong>{" "}
            {role === "freelancer" ? t("freelancer.sub") : t("client.sub")}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[t("stepLabels.accountInfo"), t("stepLabels.verifyEmail"), t("stepLabels.review")].map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > i + 1 ? "bg-green-500 text-white" :
                    step === i + 1 ? (role === "freelancer" ? "bg-blue-700 text-white" : "bg-green-700 text-white") :
                    "bg-gray-200 text-gray-400"
                  }`}>
                    {step > i + 1 ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? (role === "freelancer" ? "text-blue-700" : "text-green-700") : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 mb-1">
                  {role === "freelancer" ? t("freelancer.step1Heading") : t("client.step1Heading")}
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  {role === "freelancer" ? t("freelancer.step1Sub") : t("client.step1Sub")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("fields.firstName")} <span className="text-red-500">{t("fields.required")}</span></label>
                    <input type="text" value={form.firstName} onChange={e => update("firstName", e.target.value)}
                      placeholder="Abebe" className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("fields.lastName")} <span className="text-red-500">{t("fields.required")}</span></label>
                    <input type="text" value={form.lastName} onChange={e => update("lastName", e.target.value)}
                      placeholder="Girma" className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("fields.email")} <span className="text-red-500">{t("fields.required")}</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                      placeholder={t("fields.emailPlaceholder")}
                      className="w-full border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{role === "freelancer" ? t("freelancer.extraLabel") : t("client.extraLabel")}</label>
                  <div className="relative">
                    {role === "freelancer"
                      ? <Code2  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      : <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    }
                    <input type="text" value={form.extra} onChange={e => update("extra", e.target.value)}
                      placeholder={role === "freelancer" ? t("freelancer.extraPlaceholder") : t("client.extraPlaceholder")}
                      className="w-full border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{role === "freelancer" ? t("freelancer.phoneLabel") : t("client.phoneLabel")}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{t("fields.phonePrefix")}</span>
                    <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                      placeholder="9XX XXX XXX"
                      className="w-full border border-gray-200 pl-20 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("fields.password")} <span className="text-red-500">{t("fields.required")}</span></label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                      placeholder={t("fields.passwordPlaceholder")}
                      className="w-full border border-gray-200 px-4 py-3 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <button type="button" onClick={handleStep1Continue} disabled={isPending}
                  className={`w-full text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${role === "freelancer" ? "bg-blue-700 hover:bg-blue-800" : "bg-green-700 hover:bg-green-800"}`}>
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("otp.verifying")}</> : <>{t("otp.continueButton")} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}

            {/* ── STEP 2 — OTP ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${role === "freelancer" ? "bg-blue-50" : "bg-green-50"}`}>
                    <ShieldCheck className={`w-7 h-7 ${role === "freelancer" ? "text-blue-700" : "text-green-700"}`} />
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg mb-1">{t("otp.heading")}</h2>
                  <p className="text-sm text-gray-500">
                    {t("otp.sub", { email: form.email })}
                  </p>
                </div>

                {otpVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">{t("otp.verified")}</p>
                      <p className="text-green-700 text-xs mt-0.5">{t("otp.verifiedSub")}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block text-center">{t("otp.label")}</label>
                      <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                        {otp.map((digit, i) => (
                          <input key={i} ref={el => { inputRefs.current[i] = el; }}
                            type="text" inputMode="numeric" maxLength={1} value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                              digit
                                ? role === "freelancer"
                                  ? "border-blue-400 bg-blue-50 text-blue-800 focus:ring-blue-400"
                                  : "border-green-400 bg-green-50 text-green-800 focus:ring-green-400"
                                : "border-gray-200 text-gray-900 focus:ring-green-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button type="button" onClick={handleVerifyOtp} disabled={isPending || otp.join("").length < 6}
                      className={`w-full text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${role === "freelancer" ? "bg-blue-700 hover:bg-blue-800" : "bg-green-700 hover:bg-green-800"}`}>
                      {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("otp.verifying")}</> : t("otp.verifyButton")}
                    </button>

                    <div className="text-center">
                      {resendCooldown > 0
                        ? <p className="text-xs text-gray-400">{t("otp.resendCooldown", { seconds: resendCooldown })}</p>
                        : <button type="button" onClick={() => startTransition(async () => { await doSendOtp(); })} disabled={isPending}
                            className="text-sm text-green-700 hover:underline font-medium flex items-center gap-1 mx-auto disabled:opacity-50">
                            <RefreshCw className="w-3.5 h-3.5" /> {t("otp.resend")}
                          </button>
                      }
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep(1); setOtpVerified(false); setOtp(["","","","","",""]); setError(""); }}
                    className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    {t("otp.backButton")}
                  </button>
                  <button type="button" onClick={() => { if (!otpVerified) { setError(t("errors.verifyFirst")); return; } setError(""); setStep(3); }}
                    disabled={!otpVerified}
                    className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${role === "freelancer" ? "bg-blue-700 hover:bg-blue-800" : "bg-green-700 hover:bg-green-800"}`}>
                    {t("otp.continueButton")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 — Review ── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Role badge */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${cfg.badgeColor}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === "freelancer" ? "bg-blue-700" : "bg-green-700"}`}>
                    <cfg.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{role === "freelancer" ? t("freelancer.summaryRole") : t("client.summaryRole")}</div>
                    <div className="text-xs opacity-70">{role === "freelancer" ? t("review.findJobs") : t("review.postJobs")}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  {[
                    { label: t("review.name"),  value: `${form.firstName} ${form.lastName}` },
                    { label: t("review.email"), value: form.email },
                    ...(form.extra ? [{ label: role === "freelancer" ? t("review.title") : t("review.company"), value: form.extra }] : []),
                    { label: t("review.emailVerified"), value: t("review.emailVerifiedValue") },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-medium ${label === t("review.emailVerified") ? "text-green-600" : "text-gray-900"}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-green-600" />
                  <span className="text-sm text-gray-600">
                    {t("review.agreeTerms")}{" "}
                    <Link href="/terms" className="text-green-700 hover:underline">{t("review.termsLink")}</Link>
                    {" "}{t("review.andText")}{" "}
                    <Link href="/privacy" className="text-green-700 hover:underline">{t("review.privacyLink")}</Link>
                  </span>
                </label>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    {t("review.backButton")}
                  </button>
                  <button type="button" onClick={handleCreateAccount} disabled={isPending}
                    className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${role === "freelancer" ? "bg-blue-700 hover:bg-blue-800" : "bg-green-700 hover:bg-green-800"}`}>
                    {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("review.creating")}</> : role === "freelancer" ? t("freelancer.createButton") : t("client.createButton")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t("footer")}{" "}
            <Link href="/login" className="text-green-700 font-semibold hover:underline">{t("footerLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
