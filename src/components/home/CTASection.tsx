import Link from "next/link";
import { ArrowRight, Briefcase, User } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function CTASection() {
  return (
    <section className="glass-section py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* CTA glass panel */}
        <div
          className="relative rounded-3xl p-10 lg:p-16 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(22,101,52,0.82) 0%, rgba(6,78,59,0.85) 100%)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
          }}
        >
          {/* Ambient glow orbs */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "rgba(52,211,153,0.18)", filter: "blur(48px)" }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "rgba(16,185,129,0.14)", filter: "blur(40px)" }}
          />

          <div className="relative">
            <div className="flex justify-center mb-6">
              <BrandLogo variant="circular" size={112} showLink={false} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Join Ethiopia&apos;s Freelance Revolution?
            </h2>
            <p className="text-emerald-200 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re looking to hire top talent or find your next project,
              EthioFreelance connects you with the best of Ethiopia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=client"
                className="flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#14532d",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                  border: "1px solid rgba(255,255,255,0.60)",
                }}
              >
                <Briefcase className="w-5 h-5" />
                Hire a Freelancer
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?role=freelancer"
                className="flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(52,211,153,0.28)",
                  color: "#ffffff",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(52,211,153,0.45)",
                  boxShadow: "0 4px 16px rgba(52,211,153,0.20)",
                }}
              >
                <User className="w-5 h-5" />
                Start Freelancing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-emerald-400/80 text-sm mt-7">
              Free to join • No subscription required • Pay only 1% commission
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
