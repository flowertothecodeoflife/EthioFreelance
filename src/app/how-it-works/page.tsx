import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, Search, MessageSquare, CreditCard, Shield, Award, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "How It Works | EthioFreelance" };

export default function HowItWorksPage() {
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
              How EthioFreelance Works
            </h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Get started in minutes — whether you&apos;re hiring or looking for work.
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
                For Clients
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Hire Top Ethiopian Talent</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Post your job and receive proposals from verified freelancers within hours.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: UserPlus,      step: "1", title: "Create Account",  desc: "Sign up free. Verify with your phone number or National ID." },
                { icon: Search,        step: "2", title: "Post a Job",       desc: "Describe your project, set budget in ETB, choose fixed or hourly." },
                { icon: MessageSquare, step: "3", title: "Review & Hire",    desc: "Compare proposals, chat with freelancers in Amharic or English." },
                { icon: CreditCard,    step: "4", title: "Pay Securely",     desc: "Fund milestones via Chapa. Release payment only when satisfied." },
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
                Post a Job Now
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
                For Freelancers
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Turn Your Skills Into Income</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Join thousands of Ethiopian freelancers earning from their skills.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: UserPlus,      step: "1", title: "Build Profile",      desc: "Showcase skills, portfolio, and experience. Get verified for more trust." },
                { icon: Search,        step: "2", title: "Find Jobs",           desc: "Browse thousands of jobs filtered by category, budget, and location." },
                { icon: MessageSquare, step: "3", title: "Submit Proposal",     desc: "Write a compelling bid in Amharic or English." },
                { icon: CreditCard,    step: "4", title: "Get Paid",            desc: "Receive payments to your Chapa wallet or bank account instantly." },
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
                Start Freelancing
              </Link>
            </div>
          </div>
        </section>

        {/* ── Trust Features ── */}
        <section className="glass-section py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Trust EthioFreelance?</h2>
              <p className="text-gray-500">Built on transparency, security, and fairness.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Shield,      color: "rgba(22,101,52,0.82)",   iconColor: "text-emerald-300", border: "rgba(34,197,94,0.50)",  title: "Secure Escrow",       desc: "Payments held safely until work is approved. Powered by Chapa." },
                { icon: CheckCircle, color: "rgba(14,116,144,0.82)",  iconColor: "text-sky-300",     border: "rgba(56,189,248,0.50)", title: "KYC Verified Users",  desc: "All users verify National ID and phone. Video verification available." },
                { icon: Award,       color: "rgba(146,64,14,0.82)",   iconColor: "text-amber-300",   border: "rgba(251,191,36,0.50)", title: "Dispute Resolution",  desc: "Dedicated admin panel for fair dispute resolution with evidence submission." },
              ].map(({ icon: Icon, color, iconColor, border, title, desc }) => (
                <div key={title} className="glass-card rounded-2xl p-6 text-center flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    style={{ background: color, border: `1px solid ${border}` }}
                  >
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="glass-section py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {[
                { q: "How much does it cost to join?",       a: "EthioFreelance is completely free to join. We only charge a 1% commission on completed projects — much lower than global platforms." },
                { q: "How do I get paid?",                   a: "Payments are processed through Chapa, Ethiopia's leading payment gateway. You can withdraw to your bank account, telebirr, or other mobile money services." },
                { q: "Is my National ID information safe?",  a: "Yes. Your KYC data is encrypted and stored securely, compliant with Ethiopian data protection regulations. We never share your personal information." },
                { q: "What if there's a dispute?",           a: "We have a dedicated dispute resolution team. Both parties can submit evidence (files, chat logs, deliverables) and our admin panel will arbitrate fairly." },
                { q: "Can I use the platform in Amharic?",   a: "Yes! EthioFreelance fully supports Amharic. You can post jobs, write proposals, and communicate entirely in Amharic." },
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-500 mb-8">
              Join Ethiopia&apos;s fastest-growing freelance community today — it&apos;s free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=client"
                className="font-bold px-8 py-3.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: "#16a34a" }}
              >
                Hire a Freelancer
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
                Start Freelancing
              </Link>
            </div>
          </div>
        </section>

      </div>{/* end glass-zone */}

      <Footer />
    </main>
  );
}
