import { Shield, CreditCard, UserCheck, Lock, AlertTriangle, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Escrow Payments",
    desc: "Your money is held safely until you approve the work. Powered by Chapa — Ethiopia's trusted payment gateway.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: UserCheck,
    title: "KYC Verified Freelancers",
    desc: "All freelancers verify their National ID and phone number. Video verification available for premium accounts.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: AlertTriangle,
    title: "Fraud Prevention",
    desc: "AI-powered duplicate account detection, suspicious bidding pattern monitoring, and payment fraud alerts.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Lock,
    title: "Data Privacy",
    desc: "Your data is stored securely and compliant with Ethiopian data hosting regulations. We never sell your data.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: CreditCard,
    title: "Local Payment Support",
    desc: "Pay and receive in Ethiopian Birr (ETB) via Chapa. No foreign currency complications.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: Award,
    title: "Dispute Resolution",
    desc: "Dedicated admin arbitration panel. Submit evidence, chat logs, and files. Fair resolution guaranteed.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-green-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-green-800 border border-green-700 rounded-full px-4 py-1.5 text-sm text-green-300 mb-4">
            <Shield className="w-4 h-4" /> Built for Trust
          </div>
          <h2 className="text-3xl font-bold mb-3">Your Safety is Our Priority</h2>
          <p className="text-green-300 max-w-xl mx-auto">
            We know trust is a major barrier in Ethiopia. That&apos;s why we built multiple layers of protection for both clients and freelancers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="bg-green-800/50 border border-green-700 rounded-2xl p-6 hover:bg-green-800 transition-colors"
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-green-300 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Chapa Banner */}
        <div className="mt-12 bg-green-800 border border-green-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Powered by Chapa Payments</h3>
            <p className="text-green-300 text-sm">
              Ethiopia&apos;s leading payment gateway. Accept and send money instantly via mobile banking, telebirr, and more.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="bg-white rounded-xl px-6 py-3">
              <span className="text-green-800 font-bold text-xl">Chapa</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
