"use client";
import { useActionState, useEffect } from "react";
import { loginAdmin } from "@/app/actions/adminAuth";
import { Lock, User, AlertTriangle, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAdmin, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/admin");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Decorative Traditional Ethiopian Mesh Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Futuristic Glowing Cyber Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Shield Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="circular" size={112} showLink={false} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Security Gateway
          </h1>
          <p className="text-green-500/70 text-sm font-semibold tracking-wider uppercase">
            EthioFreelance Back Office
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#161d25]/90 border border-green-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>

          {state?.error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-300 text-sm rounded-2xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="font-medium">{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2 block">
                Security ID
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="Enter Username"
                  className="w-full bg-[#0d1217] border border-gray-800 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2 block">
                Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter Access Key"
                  className="w-full bg-[#0d1217] border border-gray-800 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium placeholder-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-green-500 text-[#0d1217] font-extrabold py-4 rounded-2xl hover:bg-green-400 active:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isPending ? (
                <span className="w-5 h-5 border-2 border-[#0d1217] border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  Establish Connection
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Safe Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-bold text-gray-500 hover:text-green-400 transition-colors uppercase tracking-widest"
          >
            ← Return to public portal
          </button>
        </div>
      </div>
    </div>
  );
}
