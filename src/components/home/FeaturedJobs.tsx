import Link from "next/link";
import { Clock, DollarSign, MapPin, Users, ArrowRight, Zap } from "lucide-react";
import ScrollStrip from "@/components/ui/ScrollStrip";

interface FeaturedJob {
  id: string;
  title: string;
  budget: number;
  type: "FIXED" | "HOURLY";
  location: string;
  category: string;
  skills: string[];
  createdAt: string | Date;
  client: { name: string; kycStatus: string };
  _count: { proposals: number };
}

interface Props { jobs?: FeaturedJob[]; }

const CAT_STYLES: Record<string, string> = {
  "IT & Software":        "bg-blue-100 text-blue-700 border-blue-200",
  "Design & Creative":    "bg-purple-100 text-purple-700 border-purple-200",
  "Writing & Content":    "bg-orange-100 text-orange-700 border-orange-200",
  "Translation":          "bg-green-100 text-green-700 border-green-200",
  "Data Entry":           "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Tutoring":             "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Finance & Accounting": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Photography & Video":  "bg-red-100 text-red-700 border-red-200",
  "NGO & Remote Work":    "bg-teal-100 text-teal-700 border-teal-200",
};

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const MOCK_JOBS: FeaturedJob[] = [
  { id: "mock-1", title: "Full Stack Web Developer (React + Node.js)",   budget: 20000, type: "FIXED",  location: "Remote",      category: "IT & Software",     skills: ["React", "Node.js", "PostgreSQL"],  createdAt: new Date(Date.now() - 7200000),  client: { name: "TechEthio Solutions", kycStatus: "APPROVED" }, _count: { proposals: 8  } },
  { id: "mock-2", title: "Amharic–English Translator – Legal Documents", budget: 6500,  type: "FIXED",  location: "Addis Ababa", category: "Translation",       skills: ["Amharic", "English", "Legal"],     createdAt: new Date(Date.now() - 18000000), client: { name: "LexEthio Law Firm",   kycStatus: "APPROVED" }, _count: { proposals: 14 } },
  { id: "mock-3", title: "Logo & Brand Identity Design for Startup",     budget: 4500,  type: "FIXED",  location: "Remote",      category: "Design & Creative", skills: ["Figma", "Branding", "Illustrator"], createdAt: new Date(Date.now() - 86400000), client: { name: "Habesha Hub",         kycStatus: "APPROVED" }, _count: { proposals: 22 } },
  { id: "mock-4", title: "Data Entry Specialist – NGO Survey Data",      budget: 200,   type: "HOURLY", location: "Addis Ababa", category: "Data Entry",        skills: ["Excel", "Data Entry"],             createdAt: new Date(Date.now() - 10800000), client: { name: "UNICEF Ethiopia",    kycStatus: "APPROVED" }, _count: { proposals: 31 } },
  { id: "mock-5", title: "Mobile App Developer – Android (Kotlin)",      budget: 40000, type: "FIXED",  location: "Remote",      category: "IT & Software",     skills: ["Kotlin", "Android", "Firebase"],   createdAt: new Date(Date.now() - 21600000), client: { name: "FinTech Ethiopia",   kycStatus: "NONE"     }, _count: { proposals: 5  } },
  { id: "mock-6", title: "Mathematics Tutor – Grade 10–12",              budget: 150,   type: "HOURLY", location: "Addis Ababa", category: "Tutoring",          skills: ["Mathematics", "Teaching"],         createdAt: new Date(Date.now() - 43200000), client: { name: "Private Client",     kycStatus: "NONE"     }, _count: { proposals: 9  } },
];

export default function FeaturedJobs({ jobs }: Props) {
  const list = jobs && jobs.length > 0 ? jobs : MOCK_JOBS;

  return (
    <section className="glass-section py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Jobs</h2>
            <p className="text-gray-500">Hand-picked opportunities from top Ethiopian employers</p>
          </div>
          <Link
            href="/jobs"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 px-4 py-2 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ScrollStrip className="-mx-4 px-4 sm:-mx-0 sm:px-0">
          {list.map((job) => {
            const isMock = job.id.startsWith("mock-");
            const href = isMock ? "/jobs" : `/jobs/${job.id}`;
            const budgetStr = job.type === "HOURLY"
              ? `ETB ${job.budget.toLocaleString()}/hr`
              : `ETB ${job.budget.toLocaleString()}`;

            return (
              <Link key={job.id} href={href} className="group flex-shrink-0 snap-start w-72 sm:w-80">
                <div className="glass-card rounded-2xl p-5 h-full flex flex-col">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CAT_STYLES[job.category] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {job.category}
                      </span>
                      {job._count.proposals < 5 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {timeAgo(job.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors leading-snug mb-1 line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    {job.client.kycStatus === "APPROVED" && (
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    )}
                    {job.client.name}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-4 flex-1">
                    {job.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.18)",
                          backdropFilter: "blur(6px)",
                          border: "1px solid rgba(255,255,255,0.28)",
                          color: "inherit",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full text-gray-400"
                        style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
                      >
                        +{job.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="pt-3 flex items-center justify-between"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.20)" }}
                  >
                    <div className="flex items-center gap-1 font-bold text-emerald-500 text-sm">
                      <DollarSign className="w-3.5 h-3.5" /> {budgetStr}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {job.location}</span>
                      <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {job._count.proposals}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* See all card */}
          <Link href="/jobs" className="flex-shrink-0 snap-start w-40 sm:w-44 flex items-center justify-center">
            <div
              className="h-full w-full min-h-[180px] rounded-2xl flex flex-col items-center justify-center gap-3 text-white transition-all duration-200 p-6 text-center hover:-translate-y-1"
              style={{
                background: "linear-gradient(135deg, rgba(22,163,74,0.80), rgba(5,150,105,0.80))",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "0 8px 32px rgba(22,163,74,0.30)",
              }}
            >
              <ArrowRight className="w-8 h-8" />
              <span className="text-sm font-bold">Browse all jobs</span>
            </div>
          </Link>
        </ScrollStrip>

      </div>
    </section>
  );
}
