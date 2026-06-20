import Link from "next/link";
import { Star, CheckCircle, ArrowRight, Briefcase } from "lucide-react";
import ScrollStrip from "@/components/ui/ScrollStrip";
import { useTranslations } from "next-intl";

interface FreelancerItem {
  id: string;
  name: string;
  kycStatus: string;
  isOnline: boolean;
  profile: {
    title: string | null;
    skills: string[];
    hourlyRate: number | null;
    rating: number;
    completedJobs: number;
  } | null;
}

interface Props { freelancers?: FreelancerItem[]; }

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",   "from-purple-500 to-pink-600",
  "from-green-500 to-emerald-600", "from-orange-500 to-amber-600",
  "from-teal-500 to-cyan-600",     "from-pink-500 to-rose-600",
  "from-indigo-500 to-violet-600", "from-red-500 to-orange-600",
];

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatRate(rate: number | null) {
  if (!rate || rate === 0) return "Negotiable";
  return `ETB ${rate.toLocaleString()}/hr`;
}

const MOCK: FreelancerItem[] = [
  { id: "mock-1", name: "Abebe Girma",   kycStatus: "APPROVED", isOnline: true,  profile: { title: "Full Stack Developer",      skills: ["React", "Node.js", "Python"],       hourlyRate: 500, rating: 4.9, completedJobs: 124 } },
  { id: "mock-2", name: "Tigist Haile",  kycStatus: "APPROVED", isOnline: true,  profile: { title: "Brand Designer",            skills: ["Figma", "Illustrator", "Branding"], hourlyRate: 350, rating: 4.8, completedJobs: 89  } },
  { id: "mock-3", name: "Dawit Bekele",  kycStatus: "APPROVED", isOnline: false, profile: { title: "Amharic–English Translator", skills: ["Amharic", "English", "Legal"],      hourlyRate: 200, rating: 5.0, completedJobs: 56  } },
  { id: "mock-4", name: "Meron Tadesse", kycStatus: "APPROVED", isOnline: true,  profile: { title: "Mobile App Developer",      skills: ["Flutter", "Kotlin", "Firebase"],    hourlyRate: 600, rating: 4.7, completedJobs: 71  } },
  { id: "mock-5", name: "Yonas Alemu",   kycStatus: "NONE",     isOnline: true,  profile: { title: "Data Analyst",              skills: ["Excel", "Power BI", "SQL"],         hourlyRate: 300, rating: 4.9, completedJobs: 48  } },
  { id: "mock-6", name: "Hana Worku",    kycStatus: "APPROVED", isOnline: false, profile: { title: "Content Writer & SEO",      skills: ["SEO", "Copywriting", "Amharic"],    hourlyRate: 250, rating: 4.8, completedJobs: 37  } },
];

export default function FeaturedFreelancers({ freelancers }: Props) {
  const t  = useTranslations("featuredFreelancers");
  const tc = useTranslations("common");
  const list = freelancers && freelancers.length > 0 ? freelancers : MOCK;
  const isLive = freelancers && freelancers.length > 0;

  return (
    <section className="glass-section py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("sectionTitle")}</h2>
            <p className="text-gray-500">
              {t("sectionSub")}
              {isLive && (
                <span
                  className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.30)",
                    color: "#4ade80",
                  }}
                >
                  Live
                </span>
              )}
            </p>
          </div>
          <Link
            href="/freelancers"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 px-4 py-2 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            {t("viewAll")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ScrollStrip className="-mx-4 px-4 sm:-mx-0 sm:px-0">
          {list.map((f) => {
            const profile       = f.profile;
            const title         = profile?.title         ?? "Freelancer";
            const skills        = profile?.skills        ?? [];
            const rating        = profile?.rating        ?? 0;
            const completedJobs = profile?.completedJobs ?? 0;
            const hourlyRate    = profile?.hourlyRate    ?? null;
            const isVerified    = f.kycStatus === "APPROVED";
            const gradient      = avatarGradient(f.name);
            const isMock        = f.id.startsWith("mock-");
            const href          = isMock ? "/freelancers" : `/freelancers/${f.id}`;

            return (
              <Link key={f.id} href={href} className="group flex-shrink-0 snap-start w-60 sm:w-64">
                <div className="glass-card rounded-2xl p-5 h-full flex flex-col">

                  {/* Avatar row */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {initials(f.name)}
                      </div>
                      {f.isOnline && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full"
                          style={{ border: "2px solid rgba(255,255,255,0.6)", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors truncate">
                          {f.name}
                        </span>
                        {isVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{title}</p>
                      {f.isOnline
                        ? <span className="text-[10px] text-emerald-400 font-medium">● {t("online")}</span>
                        : <span className="text-[10px] text-gray-400">● {tc("offline")}</span>
                      }
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-4 flex-1">
                    {skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          color: "#4ade80",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {skills.length > 3 && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full text-gray-400"
                        style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
                      >
                        +{skills.length - 3}
                      </span>
                    )}
                    {skills.length === 0 && (
                      <span className="text-[10px] text-gray-400 italic">{tc("no")}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="pt-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.20)" }}
                  >
                    <div className="flex items-center gap-1">
                      {rating > 0 ? (
                        <>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-gray-800">{rating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{t("rating", { rating: "—" })}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-500">
                        {hourlyRate && hourlyRate > 0
                          ? t("hourlyRate", { rate: hourlyRate.toLocaleString() })
                          : tc("etb")}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-0.5 justify-end">
                        <Briefcase className="w-2.5 h-2.5" /> {t("completedJobs", { count: completedJobs })}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* See all card */}
          <Link href="/freelancers" className="flex-shrink-0 snap-start w-44 flex items-center justify-center">
            <div
              className="h-full w-full min-h-[200px] rounded-2xl flex flex-col items-center justify-center gap-3 text-white transition-all duration-200 p-6 text-center hover:-translate-y-1"
              style={{
                background: "linear-gradient(135deg, rgba(22,163,74,0.80), rgba(5,150,105,0.80))",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "0 8px 32px rgba(22,163,74,0.30)",
              }}
            >
              <ArrowRight className="w-8 h-8" />
              <span className="text-sm font-bold">{t("viewAll")}</span>
            </div>
          </Link>
        </ScrollStrip>

      </div>
    </section>
  );
}
