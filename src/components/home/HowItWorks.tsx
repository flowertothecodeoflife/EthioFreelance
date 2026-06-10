import { UserPlus, Search, MessageSquare, CreditCard } from "lucide-react";

const clientSteps = [
  { icon: UserPlus, step: "01", title: "Create Account", desc: "Sign up free with your phone number or email. Verify your identity with National ID." },
  { icon: Search, step: "02", title: "Post a Job", desc: "Describe your project, set your budget in ETB, and choose fixed price or hourly." },
  { icon: MessageSquare, step: "03", title: "Review Proposals", desc: "Receive bids from verified Ethiopian freelancers. Chat directly in Amharic or English." },
  { icon: CreditCard, step: "04", title: "Pay Securely", desc: "Fund milestones via Chapa. Money is released only when you approve the work." },
];

const freelancerSteps = [
  { icon: UserPlus, step: "01", title: "Build Your Profile", desc: "Showcase your skills, portfolio, and experience. Get verified for more trust." },
  { icon: Search, step: "02", title: "Find Jobs", desc: "Browse thousands of jobs filtered by category, budget, and location." },
  { icon: MessageSquare, step: "03", title: "Submit Proposals", desc: "Write compelling bids. Use voice notes if writing is difficult." },
  { icon: CreditCard, step: "04", title: "Get Paid", desc: "Receive payments directly to your Chapa wallet or bank account." },
];

export default function HowItWorks() {
  return (
    <section className="glass-section py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Simple, transparent, and built for Ethiopia. Get started in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Clients */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-700 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                For Clients
              </div>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.30)" }} />
            </div>
            <div className="space-y-6">
              {clientSteps.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="glass-card rounded-2xl flex gap-4 p-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-700 rounded-xl flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-green-600 mb-0.5">STEP {step}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Freelancers */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                For Freelancers
              </div>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.30)" }} />
            </div>
            <div className="space-y-6">
              {freelancerSteps.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="glass-card rounded-2xl flex gap-4 p-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-green-500 mb-0.5">STEP {step}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
