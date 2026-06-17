"use client";
import { useState, useCallback } from "react";
import { Search, TrendingUp, Shield, Zap, Star, ArrowRight, Users, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface HeroStats {
  totalFreelancers: number;
  totalJobs: number;
  completedJobs: number;
}

interface HeroSectionProps {
  stats?: HeroStats;
}



/** Format a number compactly: 1500 → "1.5k+", 42 → "42" */
function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`;
  return n > 0 ? `${n}+` : "—";
}

/**
 * Abstract accent shape — a small rotated square (diamond) with a colour fill.
 * Used instead of a plain circle dot so the stat pills look more distinctive.
 */
function Diamond({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0" aria-hidden>
      <rect x="1" y="1" width="10" height="10" rx="2" fill={color}
        transform="rotate(45 6 6)" />
    </svg>
  );
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "freelancers">("jobs");
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";
  const t = useTranslations("hero");
  const ts = useTranslations("stats");

  const popularItems = t("popularItems").split(",").map((s) => s.trim());

  const handleSearch = useCallback(() => {
    const base = activeTab === "jobs" ? "/jobs" : "/freelancers";
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`${base}${params.size ? `?${params}` : ""}`);
  }, [activeTab, query, router]);

  // Stat pill data — uses real DB numbers when available, else empty dash
  const pills = [
    {
      value: stats ? fmt(stats.totalFreelancers) : "—",
      label: ts("freelancers"),
      color: "#22c55e",
      pos: "-top-4 -left-6",
      icon: <Users className="w-3 h-3" style={{ color: "#22c55e" }} />,
    },
    {
      value: stats ? fmt(stats.totalJobs) : "—",
      label: ts("jobsPosted"),
      color: "#60a5fa",
      pos: "-top-2 -right-8",
      icon: <Briefcase className="w-3 h-3" style={{ color: "#60a5fa" }} />,
    },
    {
      value: stats ? fmt(stats.completedJobs) : "—",
      label: ts("completedJobs"),
      color: "#f59e0b",
      pos: "-bottom-2 -left-8",
      icon: <TrendingUp className="w-3 h-3" style={{ color: "#f59e0b" }} />,
    },
    {
      value: ts("successRateValue"),
      label: ts("successRate"),
      color: "#a78bfa",
      pos: "-bottom-4 -right-4",
      icon: <Star className="w-3 h-3" style={{ color: "#a78bfa" }} />,
    },
  ];

  return (
    <section className="glass-section relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* ══════════════════════════════════════
              LEFT — content panel
          ══════════════════════════════════════ */}
          <div className="w-full lg:w-[55%] text-center lg:text-left">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-5"
              style={{
                background: "rgba(22,101,52,0.90)",
                border: "1px solid rgba(34,197,94,0.60)",
                color: "#bbf7d0",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="w-2 h-2 rounded-sm rotate-45 animate-pulse flex-shrink-0 inline-block"
                style={{ backgroundColor: "#4ade80" }}
              />
              {t("badge")}
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.4rem] font-extrabold leading-tight mb-4 text-gray-900">
              {t("headline")}{" "}
              <span className="text-green-600">{t("headlineAccent")}</span>
            </h1>

            <p className="text-gray-600 text-base sm:text-lg mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("sub")}
            </p>

            {/* Search Tabs */}
            <div
              className="inline-flex gap-1 rounded-2xl p-1 mb-5"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
              }}
            >
              {(["jobs", "freelancers"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-green-700 text-white shadow-md"
                      : "text-gray-600 hover:text-green-700 hover:bg-white/40"
                  }`}
                >
                  {tab === "jobs" ? t("tabJobs") : t("tabFreelancers")}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="flex gap-2 max-w-xl mx-auto lg:mx-0 mb-5">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={activeTab === "jobs" ? t("searchJobPlaceholder") : t("searchFreelancerPlaceholder")}
                  className="w-full bg-white text-gray-800 pl-9 pr-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm border border-gray-200"
                />
              </div>
              {/* Inline style locks colour — immune to dark mode CSS overrides */}
              <button
                onClick={handleSearch}
                style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                className="flex-shrink-0 font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 px-4 sm:px-6 text-sm"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">{t("searchButton")}</span>
              </button>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-1.5 mb-8 justify-center lg:justify-start">
              <span className="text-gray-500 text-xs self-center">{t("popularSearches")}</span>
              {popularItems.map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); setTimeout(handleSearch, 0); }}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors text-gray-700 hover:text-green-700"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    backdropFilter: "var(--glass-blur)",
                  }}
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                {t("trustBadge1")}
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                {t("trustBadge2")}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                {t("trustBadge3")}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════
              RIGHT — abstract glass shape (desktop only)
          ══════════════════════════════════════ */}
          <div className="hidden lg:flex lg:w-[45%] items-center justify-center flex-shrink-0">
            <div className="relative w-[420px] h-[420px] xl:w-[460px] xl:h-[460px]">

              {/* Ambient glow that shifts colour with mode */}
              <div
                className="absolute inset-[-32px] transition-all duration-700 pointer-events-none"
                style={{
                  background: isDark
                    ? "radial-gradient(ellipse at 55% 45%, rgba(34,197,94,0.14) 0%, transparent 68%)"
                    : "radial-gradient(ellipse at 55% 45%, rgba(34,197,94,0.20) 0%, transparent 68%)",
                }}
              />

              {/* ── Abstract blob shape — CSS clip-path organic polygon ── */}
              <div
                className="relative w-full h-full overflow-hidden shadow-2xl transition-all duration-700"
                style={{
                  /* Organic 8-point blob — not a circle, not a rectangle */
                  clipPath: "polygon(50% 0%, 80% 10%, 100% 35%, 90% 65%, 70% 90%, 40% 100%, 12% 80%, 0% 50%, 10% 20%, 30% 5%)",
                  border: isDark
                    ? "2px solid rgba(255,255,255,0.10)"
                    : "2px solid rgba(255,255,255,0.65)",
                  boxShadow: isDark
                    ? "0 0 0 1px rgba(34,197,94,0.15), 0 32px 80px rgba(0,0,0,0.50)"
                    : "0 0 0 1px rgba(34,197,94,0.12), 0 32px 80px rgba(0,0,0,0.18)",
                }}
              >
                {/* Day image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                  style={{ backgroundImage: "url('/hero-bg-day.png')", opacity: isDark ? 0 : 1 }}
                />
                {/* Night image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                  style={{ backgroundImage: "url('/hero-bg-night.png')", opacity: isDark ? 1 : 0 }}
                />
                {/* Subtle glass tint */}
                <div
                  className="absolute inset-0 transition-all duration-700"
                  style={{
                    background: isDark ? "rgba(10,15,30,0.28)" : "rgba(255,255,255,0.06)",
                  }}
                />
                {/* Specular top-left sheen */}
                <div
                  className="absolute top-0 left-0 w-2/3 h-1/2 pointer-events-none"
                  style={{
                    background: isDark
                      ? "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)"
                      : "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.40) 0%, transparent 60%)",
                  }}
                />
              </div>

              {/* ── Floating stat pills — real data, abstract diamond accents ── */}
              {pills.map((pill) => (
                <div
                  key={pill.label}
                  className={`absolute ${pill.pos} flex items-center gap-2 px-3 py-2 rounded-2xl shadow-xl`}
                  style={{
                    background: "var(--glass-bg-strong)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  {/* Abstract diamond icon instead of plain circle */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${pill.color}22`, border: `1px solid ${pill.color}44` }}
                  >
                    {pill.icon}
                  </div>
                  <div>
                    <div className="text-gray-900 font-extrabold text-sm leading-none">{pill.value}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">{pill.label}</div>
                  </div>
                </div>
              ))}

              {/* Centre quote card */}
              <div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-44 rounded-2xl p-3 text-center shadow-2xl"
                style={{
                  background: "var(--glass-bg-strong)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div className="flex justify-center gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-[11px] font-medium leading-snug mb-2.5">
                  &ldquo;Found my best client in 2 days!&rdquo;
                </p>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-1 text-[11px] font-bold bg-green-600 text-white px-3 py-1.5 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Join Free <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
