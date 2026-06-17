import { Users, Briefcase, CheckCircle, Star, Shield, CreditCard, Award } from "lucide-react";
import { useTranslations } from "next-intl";

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

/** Inline shimmer bar — no extra CSS needed */
function Shimmer({ w = "w-16" }: { w?: string }) {
  return (
    <span
      className={`inline-block ${w} h-7 rounded-lg animate-pulse`}
      style={{ background: "rgba(255,255,255,0.20)" }}
      aria-hidden
    />
  );
}

export default function StatsSection({ stats }: Props) {
  const t = useTranslations("stats");
  const loading = !stats;

  const items = [
    {
      icon: Users,
      value: loading ? null : fmt(stats!.totalFreelancers),
      label: t("freelancers"),
      sub: "Verified professionals",
      accent: "text-emerald-400",
      glow: "rgba(52,211,153,0.18)",
    },
    {
      icon: Briefcase,
      value: loading ? null : fmt(stats!.totalJobs),
      label: t("jobsPosted"),
      sub: "Across all categories",
      accent: "text-sky-400",
      glow: "rgba(56,189,248,0.18)",
    },
    {
      icon: CheckCircle,
      value: loading ? null : fmt(stats!.completedJobs),
      label: t("completedJobs"),
      sub: "Successfully delivered",
      accent: "text-teal-400",
      glow: "rgba(45,212,191,0.18)",
    },
    {
      icon: Star,
      value: t("successRateValue"),
      label: t("successRate"),
      sub: "Client satisfaction",
      accent: "text-amber-400",
      glow: "rgba(251,191,36,0.18)",
    },
  ];

  return (
    <section className="glass-section py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Stat cards — 2-col on mobile, 4-col on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
          {items.map(({ icon: Icon, value, label, sub, accent, glow }) => (
            <div
              key={label}
              className="glass-card rounded-2xl p-3.5 sm:p-6 relative overflow-hidden"
            >
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: glow, filter: "blur(16px)" }}
              />
              <div className="relative">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${accent}`} />
                </div>
                <div className={`text-xl sm:text-3xl font-black ${accent} mb-0.5`}>
                  {value === null ? <Shimmer w="w-12 sm:w-16" /> : value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{label}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Desktop: static trust strip ── */}
        <div
          className="hidden sm:flex items-center justify-center gap-8 py-4 px-6 rounded-2xl"
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

        {/* ── Mobile: infinite horizontal marquee ticker ── */}
        <div
          className="sm:hidden overflow-hidden rounded-2xl py-3"
          style={{
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          {/*
           * Two identical lists side-by-side so the loop is seamless.
           * CSS animation scrolls them leftward; when the first copy exits
           * the second has already filled the gap — pure CSS, no JS needed.
           */}
          <div className="flex w-max animate-marquee">
            {[...TRUST_BADGES, ...TRUST_BADGES].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-center gap-2 px-5 whitespace-nowrap">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">{label}</span>
                <span className="text-gray-500 text-xs">· {sub}</span>
                {/* Separator dot between items */}
                <span className="text-gray-300 ml-4 select-none">◆</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
