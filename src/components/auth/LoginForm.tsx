"use client";
import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(false);

    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // Normalize identifier (if phone, we prepend +251 if not present)
      let loginValue = identifier;
      if (loginMethod === "phone") {
        const cleaned = identifier.replace(/\s+/g, "");
        loginValue = cleaned.startsWith("+251") ? cleaned : `+251${cleaned.startsWith("0") ? cleaned.slice(1) : cleaned}`;
      }

      const res = await signIn("credentials", {
        email: loginValue, // authorize will check if this is email or phone
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(t("errorInvalid"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <BrandLogo variant="circular" size={96} showLink={false} />
        </div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">{t("title")}</h1>
        <p className="text-gray-500">{t("sub")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Login Method Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setLoginMethod("email"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              loginMethod === "email" ? "bg-white text-green-800 shadow-sm" : "text-gray-500"
            }`}
          >
            <Mail className="w-4 h-4" /> {t("tabEmail")}
          </button>
          <button
            onClick={() => { setLoginMethod("phone"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              loginMethod === "phone" ? "bg-white text-green-800 shadow-sm" : "text-gray-500"
            }`}
          >
            <Phone className="w-4 h-4" /> {t("tabPhone")}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              {loginMethod === "email" ? t("emailLabel") : "Phone Number"}
            </label>
            <div className="relative">
              {loginMethod === "email" ? (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              ) : (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">🇪🇹 +251</span>
              )}
              <input
                type={loginMethod === "email" ? "email" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={loginMethod === "email" ? t("emailPlaceholder") : t("phonePlaceholder")}
                className={`w-full border border-gray-200 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  loginMethod === "email" ? "pl-10 pr-4" : "pl-20 pr-4"
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">{t("passwordLabel")}</label>
              <Link href="/forgot-password" className="text-sm text-green-700 hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full border border-gray-200 pl-10 pr-10 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPass ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("signingIn") : t("signInButton")}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3">or continue with</div>
          </div>

          <button
            type="button"
            disabled
            title="Telebirr login is coming soon"
            className="w-full border border-gray-200 text-gray-400 font-medium py-3 rounded-xl bg-gray-50 cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-lg">📱</span> Continue with Telebirr
            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full ml-1 font-semibold">Coming soon</span>
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-green-700 font-semibold hover:underline">{t("signUp")}</Link>
      </p>
    </div>
  );
}
