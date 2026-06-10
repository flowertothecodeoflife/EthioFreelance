import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, Search, MessageSquare, CreditCard, Shield, Award, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "How It Works | EthioFreelance" };

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen page-bg">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">How EthioFreelance Works</h1>
          <p className="text-green-200 text-lg">Simple, transparent, and built for Ethiopia. Get started in minutes.</p>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full">For Clients</span>
            <h2 className="text-3xl font-bold text-green-900 mt-4 mb-3">Hire Top Ethiopian Talent</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Post your job and receive proposals from verified freelancers within hours.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, step: "1", title: "Create Account", desc: "Sign up free. Verify with your phone number or National ID." },
              { icon: Search, step: "2", title: "Post a Job", desc: "Describe your project, set budget in ETB, choose fixed or hourly." },
              { icon: MessageSquare, step: "3", title: "Review & Hire", desc: "Compare proposals, chat with freelancers in Amharic or English." },
              { icon: CreditCard, step: "4", title: "Pay Securely", desc: "Fund milestones via Chapa. Release payment only when satisfied." },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-400 rounded-full flex items-center justify-center text-green-900 font-bold text-sm">
                    {step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/post-job" className="bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-green-800 transition-colors inline-block">
              Post a Job Now
            </Link>
          </div>
        </div>
      </section>

      {/* For Freelancers */}
      <section className="py-20" style={{ background: "var(--section-bg)", borderTop: "1px solid var(--section-border)", borderBottom: "1px solid var(--section-border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full">For Freelancers</span>
            <h2 className="text-3xl font-bold text-green-900 mt-4 mb-3">Turn Your Skills Into Income</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Join thousands of Ethiopian freelancers earning from their skills.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, step: "1", title: "Build Profile", desc: "Showcase skills, portfolio, and experience. Get verified for more trust." },
              { icon: Search, step: "2", title: "Find Jobs", desc: "Browse thousands of jobs filtered by category, budget, and location." },
              { icon: MessageSquare, step: "3", title: "Submit Proposal", desc: "Write a compelling bid. Use voice notes if writing is difficult." },
              { icon: CreditCard, step: "4", title: "Get Paid", desc: "Receive payments to your Chapa wallet or bank account instantly." },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/register?role=freelancer" className="bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-green-800 transition-colors inline-block">
              Start Freelancing
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-900 mb-3">Why Trust EthioFreelance?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Secure Escrow", desc: "Payments held safely until work is approved. Powered by Chapa." },
              { icon: CheckCircle, title: "KYC Verified", desc: "All users verify National ID and phone. Video verification available." },
              { icon: Award, title: "Dispute Resolution", desc: "Dedicated admin panel for fair dispute resolution with evidence submission." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: "var(--section-bg)", borderTop: "1px solid var(--section-border)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-green-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How much does it cost to join?", a: "EthioFreelance is completely free to join. We only charge a 1% commission on completed projects — much lower than global platforms." },
              { q: "How do I get paid?", a: "Payments are processed through Chapa, Ethiopia's leading payment gateway. You can withdraw to your bank account, telebirr, or other mobile money services." },
              { q: "Is my National ID information safe?", a: "Yes. Your KYC data is encrypted and stored securely, compliant with Ethiopian data protection regulations. We never share your personal information." },
              { q: "What if there's a dispute?", a: "We have a dedicated dispute resolution team. Both parties can submit evidence (files, chat logs, deliverables) and our admin panel will arbitrate fairly." },
              { q: "Can I use the platform in Amharic?", a: "Yes! EthioFreelance fully supports Amharic. You can post jobs, write proposals, and communicate entirely in Amharic." },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-xl border border-gray-100 p-5 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <span className="text-green-600 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
