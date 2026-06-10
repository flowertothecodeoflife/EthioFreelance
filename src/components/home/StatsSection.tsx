import { Users, Briefcase, CheckCircle, Star, Shield, CreditCard, Award } from "lucide-react";

interface Props {
  stats?: {
    totalFreelancers: number;
    totalJobs: number;
    completedJobs: number;
  };
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`;
  return n > 0 ? `${n}+` : "0";
}

const TRUST_BADGES = [
  { icon: Shield,     label: "Secure Escrow",     sub: "Chapa-powered"          },
  { icon: CreditCard, label: "Pay in ETB",         sub: "No forex hassle"        },
  { icon: Award,      label: "Dispute Protection", sub: "Fair admin arbitration" },
];

export default function StatsSection({ stats }: Props) {
  const items = [
    { icon: Users,        value: stats ? fmt(stats.totalFreelancers) : "—", label: "Registered Freelancers", sub: "Verified professionals",  accent: "text-emerald-400", glow: "rgba(52,211,153,0.18)" },
    { icon: Briefcase,    value: stats ? fmt(stats.totalJobs)        : "—", label: "Jobs Posted",            sub: "Across all categories",   accent: "text-sky-400",     glow: "rgba(56,189,248,0.18)" },
    { icon: CheckCircle,  value: stats ? fmt(stats.completedJobs)    : "—", label: "Projects Completed",     sub: "Successfully delivered",  accent: "text-teal-400",    glow: "rgba(45,212,191,0.18)" },
    { icon: Star,         value: "4.8/5",                                   label: "Average Rating",         sub: "Client satisfaction",     accent: "text-amber-400",   glow: "rgba(251,191,36,0.18)" },
  ];

  return (
    <section className="glass-section py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {items.map(({ icon: Icon, value, label, sub, accent, glow }) => (
            <div
              key={label}
              className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
            >
              {/* Ambient glow blob */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: glow, filter: "blur(16px)" }}
              />
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
                >
                  <Icon className={`w-5 h-5 ${accent}`} />
                </div>
                <div className={`text-2xl sm:text-3xl font-black ${accent} mb-0.5`}>{value}</div>
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-4 px-6 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <Icon className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <span className="font-semibold text-gray-800">{label}</span>
                <span className="text-gray-500 ml-1.5 text-xs">{sub}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
