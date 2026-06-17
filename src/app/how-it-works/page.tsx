import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, Search, MessageSquare, CreditCard, Shield, Award, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata = { title: "How It Works | EthioFreelance" };

export default async function HowItWorksPage() {
  const t = await getTranslations("howItWorks");
  return (
    /*
     * bg-transparent so the fixed ParallaxBackground (rendered in layout.tsx)
     * shows through — identical treatment to the home page glass-zone.
     */
    <main className="min-h-screen bg-transparent">
      <Navbar />

      {/* ── All content wrapped in glass-zone so every section floats
          on top of the same parallax background as the home page ── */}
      <div className="glass-zone">

        {/* ── Hero banner ── */}
        <section className="glass-section py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            {/* Accent chip */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6"
              style={{
                background: "rgba(22,101,52,0.85)",
                border: "1px solid rgba(34,197,94,0.55)",
                color: "#bbf7d0",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="w-2 h-2 rounded-sm rotate-45 bg-green-400 inline-block flex-shrink-0" />
              Simple · Transparent · Ethiopian
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              {t("pageSub")}
            </p>
          </div>
        </section>

        {/* ── For Clients ── */}
        <section className="glass-section py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span
                className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
                style={{
                  background: "rgba(22,101,52,0.80)",
                  color: "#bbf7d0",
                  border: "1px solid rgba(34,197,94,0.40)",
                }}
              >
                {t("forClients")}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("clientSteps.step1Title")}</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                {t("pageSub")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: UserPlus,      step: "1", title: t("clientSteps.step1Title"),  desc: t("clientSteps.step1Desc") },
                { icon: Search,        step: "2", title: t("clientSteps.step2Title"),  desc: t("clientSteps.step2Desc") },
                { icon: MessageSquare, step: "3", title: t("clientSteps.step3Title"),  desc: t("clientSteps.step3Desc") },
                { icon: CreditCard,    step: "4", title: t("clientSteps.step3Title"),  desc: t("clientSteps.step3Desc") },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="glass-card rounded-2xl p-6 text-center flex flex-col items-center">
                  <div className="relative mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "rgba(22,101,52,0.70)", border: "1px solid rgba(34,197,94,0.35)" }}
                    >
                      <Icon className="w-8 h-8 text-green-300" />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow"
                      style={{ background: "#4ade80", color: "#14532d" }}
                    >
                      {step}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/post-job"
                className="inline-block font-bold px-8 py-3.5 rounded-xl transition-colors text-white"
                style={{ background: "#16a34a" }}
              >
                {t("ctaPost")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── For Freelancers ── */}
        <section className="glass-section py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span
                className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
                style={{
                  background: "rgba(14,116,144,0.88)",
                  color: "#bae6fd",
                  border: "1px solid rgba(56,189,248,0.55)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {t("forFreelancers")}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("freelancerSteps.step1Title")}</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                {t("ctaSub")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: UserPlus,      step: "1", title: t("freelancerSteps.step1Title"), desc: t("freelancerSteps.step1Desc") },
                { icon: Search,        step: "2", title: t("freelancerSteps.step2Title"), desc: t("freelancerSteps.step2Desc") },
                { icon: MessageSquare, step: "3", title: t("freelancerSteps.step3Title"), desc: t("freelancerSteps.step3Desc") },
                { icon: CreditCard,    step: "4", title: t("freelancerSteps.step3Title"), desc: t("freelancerSteps.step3Desc") },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="glass-card rounded-2xl p-6 text-center flex flex-col items-center">
                  <div className="relative mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "rgba(14,116,144,0.82)", border: "1px solid rgba(56,189,248,0.50)" }}
                    >
                      <Icon className="w-8 h-8 text-sky-300" />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow"
                      style={{ background: "#38bdf8", color: "#0c4a6e" }}
                    >
                      {step}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/register?role=freelancer"
                className="inline-block font-bold px-8 py-3.5 rounded-xl transition-colors text-white"
                style={{ background: "#16a34a" }}
              >
                {t("ctaFind")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="glass-section py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              {t("faqTitle")}
            </h2>
            <div className="space-y-3">
              {[
                { q: t("faq.q1"), a: t("faq.a1") },
                { q: t("faq.q2"), a: t("faq.a2") },
                { q: t("faq.q3"), a: t("faq.a3") },
                { q: t("faq.q4"), a: t("faq.a4") },
                { q: t("faq.q5"), a: t("faq.a5") },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl p-5"
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4">
                    <span>{q}</span>
                    <span
                      className="text-green-600 text-xl flex-shrink-0 transition-transform duration-200 group-open:rotate-45"
                      style={{ display: "inline-block" }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-gray-500 text-sm mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="glass-section py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("ctaTitle")}</h2>
            <p className="text-gray-500 mb-8">{t("ctaSub")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=client"
                className="font-bold px-8 py-3.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: "#16a34a" }}
              >
                {t("ctaPost")}
              </Link>
              <Link
                href="/register?role=freelancer"
                className="font-bold px-8 py-3.5 rounded-xl transition-all"
                style={{
                  background: "var(--glass-bg-strong)",
                  backdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border)",
                  color: "inherit",
                }}
              >
                {t("ctaFind")}
              </Link>
            </div>
          </div>
        </section>

      </div>{/* end glass-zone */}

      <Footer />
    </main>
  );
}
