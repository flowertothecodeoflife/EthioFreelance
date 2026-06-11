"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Filter, MapPin, Clock, Bookmark, X,
  SlidersHorizontal, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// Category values must exactly match Job.category in the DB
const CATEGORIES = [
  "All",
  "IT & Software",
  "Design & Creative",
  "Writing & Content",
  "Translation",
  "Data Entry",
  "Tutoring",
  "Finance & Accounting",
  "NGO & Remote Work",
  "Photography & Video",
  "Local Services",
  "Government Tasks",
  "Other",
];

const LOCATIONS   = ["All Ethiopia", "Remote", "Addis Ababa", "Dire Dawa", "Mekelle", "Hawassa", "Bahir Dar"];
const BUDGET_RANGES = ["Any Budget", "Under ETB 5,000", "ETB 5,000–15,000", "ETB 15,000–50,000", "ETB 50,000+"];

const CAT_COLORS: Record<string, string> = {
  "IT & Software":        "bg-blue-100 text-blue-700",
  "Translation":          "bg-green-100 text-green-700",
  "Design & Creative":    "bg-purple-100 text-purple-700",
  "Data Entry":           "bg-cyan-100 text-cyan-700",
  "Tutoring":             "bg-yellow-100 text-yellow-700",
  "Finance & Accounting": "bg-indigo-100 text-indigo-700",
  "Writing & Content":    "bg-orange-100 text-orange-700",
  "NGO & Remote Work":    "bg-teal-100 text-teal-700",
  "Photography & Video":  "bg-red-100 text-red-700",
  "Local Services":       "bg-amber-100 text-amber-700",
  "Government Tasks":     "bg-slate-100 text-slate-700",
};

// ─── Mock fallback (used when DB is empty) ────────────────────────────────────

const MOCK_JOBS = [
  { id: "mock-1",  title: "Full Stack Web Developer (React + Node.js)",     company: "TechEthio Solutions", budget: "ETB 15,000–25,000", type: "Fixed",  location: "Remote",      posted: "2h ago",  category: "IT & Software",       skills: ["React", "Node.js", "PostgreSQL"],       proposals: 8,  urgent: true  },
  { id: "mock-2",  title: "Amharic to English Translator – Legal Documents", company: "LexEthio Law Firm",   budget: "ETB 5,000–8,000",   type: "Fixed",  location: "Addis Ababa", posted: "5h ago",  category: "Translation",          skills: ["Amharic", "English", "Legal"],           proposals: 14, urgent: false },
  { id: "mock-3",  title: "Logo & Brand Identity Design for Startup",        company: "Habesha Startup Hub", budget: "ETB 3,000–6,000",   type: "Fixed",  location: "Remote",      posted: "1d ago",  category: "Design & Creative",    skills: ["Illustrator", "Branding", "Logo"],       proposals: 22, urgent: false },
  { id: "mock-4",  title: "Data Entry Specialist – NGO Survey Data",         company: "UNICEF Ethiopia",     budget: "ETB 200/hr",         type: "Hourly", location: "Addis Ababa", posted: "3h ago",  category: "Data Entry",           skills: ["Excel", "Data Entry"],                   proposals: 31, urgent: true  },
  { id: "mock-5",  title: "Mobile App Developer – Android (Kotlin)",         company: "FinTech Ethiopia",    budget: "ETB 30,000–50,000",  type: "Fixed",  location: "Remote",      posted: "6h ago",  category: "IT & Software",       skills: ["Kotlin", "Android", "Firebase"],         proposals: 5,  urgent: false },
  { id: "mock-6",  title: "Mathematics Tutor – Grade 10-12",                 company: "Private Client",      budget: "ETB 150/hr",         type: "Hourly", location: "Addis Ababa", posted: "12h ago", category: "Tutoring",             skills: ["Mathematics", "Teaching"],               proposals: 9,  urgent: false },
  { id: "mock-7",  title: "Social Media Manager – Amharic Content",          company: "Ethio Brand Co.",     budget: "ETB 8,000/mo",       type: "Fixed",  location: "Remote",      posted: "2d ago",  category: "Writing & Content",    skills: ["Social Media", "Amharic", "Content"],    proposals: 18, urgent: false },
  { id: "mock-8",  title: "Accountant – Monthly Bookkeeping",                company: "SME Ethiopia",        budget: "ETB 5,000/mo",       type: "Fixed",  location: "Addis Ababa", posted: "1d ago",  category: "Finance & Accounting", skills: ["Accounting", "QuickBooks", "Excel"],     proposals: 12, urgent: false },
  { id: "mock-9",  title: "Video Editor – YouTube Channel",                  company: "EthioVlog",           budget: "ETB 2,000/video",    type: "Fixed",  location: "Remote",      posted: "4h ago",  category: "Photography & Video",  skills: ["Premiere Pro", "After Effects"],         proposals: 7,  urgent: false },
  { id: "mock-10", title: "Python Data Analyst – Sales Dashboard",           company: "Retail Ethiopia",     budget: "ETB 12,000–18,000",  type: "Fixed",  location: "Remote",      posted: "8h ago",  category: "IT & Software",       skills: ["Python", "Pandas", "Power BI"],          proposals: 11, urgent: false },
  { id: "mock-11", title: "Tigrinya Interpreter – Conference Event",         company: "AU Summit Org",       budget: "ETB 3,500/day",      type: "Fixed",  location: "Addis Ababa", posted: "1d ago",  category: "Translation",          skills: ["Tigrinya", "English", "Interpretation"], proposals: 4,  urgent: true  },
  { id: "mock-12", title: "WordPress Website for Restaurant",                 company: "Habesha Kitchen",     budget: "ETB 6,000–10,000",   type: "Fixed",  location: "Remote",      posted: "3d ago",  category: "IT & Software",       skills: ["WordPress", "PHP", "Design"],            proposals: 16, urgent: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDbJob(job: any) {
  const isHourly   = job.type === "HOURLY";
  const budgetStr  = isHourly
    ? `ETB ${job.budget.toLocaleString()}/hr`
    : `ETB ${job.budget.toLocaleString()}`;
  const ms         = Date.now() - new Date(job.createdAt).getTime();
  const hrs        = Math.floor(ms / 3600000);
  const postedStr  = hrs < 1 ? "Just now" : hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  return {
    id: job.id, title: job.title,
    company:   job.client?.name || "Client",
    budget:    budgetStr,
    type:      isHourly ? "Hourly" : "Fixed",
    location:  job.location,
    posted:    postedStr,
    category:  job.category,
    skills:    job.skills,
    proposals: job._count?.proposals ?? 0,
    urgent:    false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobsListing({ initialJobs = [], dbHasJobs = false }: { initialJobs?: any[]; dbHasJobs?: boolean }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigating] = useTransition();

  // ── Derive active category from URL — single source of truth ────────────────
  const urlCat = searchParams.get("category") ?? "";
  const activeCat = CATEGORIES.find(c => c.toLowerCase() === urlCat.toLowerCase()) ?? "All";

  // ── Local UI filters (don't require a server refetch) ──────────────────────
  const [search,         setSearch]         = useState(searchParams.get("q") ?? "");
  const [selectedLoc,    setSelectedLoc]    = useState("All Ethiopia");
  const [jobType,        setJobType]        = useState("All");
  const [showFilters,    setShowFilters]    = useState(false);
  const [page,           setPage]           = useState(1);

  // Reset to page 1 whenever category or search changes
  useEffect(() => { setPage(1); }, [activeCat, search]);

  // ── Navigate to a new category — updates URL → triggers server refetch ──────
  const handleCatClick = (cat: string) => {
    const params = new URLSearchParams();
    if (cat !== "All") params.set("category", cat);
    if (search)        params.set("q", search);
    startNavigating(() => {
      router.push(`/jobs${params.size ? `?${params}` : ""}`);
    });
  };

  // ── Search submit — also updates URL ─────────────────────────────────────────
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeCat !== "All") params.set("category", activeCat);
    if (search)              params.set("q", search);
    startNavigating(() => {
      router.push(`/jobs${params.size ? `?${params}` : ""}`);
    });
  };

  // ── Map DB jobs or fall back to mock ─────────────────────────────────────────
  // isUsingMock is true only when the DB has NO jobs at all (not just filtered empty)
  const base = initialJobs.length > 0 ? initialJobs.map(mapDbJob) : MOCK_JOBS;
  const isUsingMock = !dbHasJobs;

  // ── Client-side secondary filters (location, type) on top of server data ────
  const filtered = base.filter(job => {
    const matchSearch = !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.skills.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const matchLoc  = selectedLoc === "All Ethiopia" || job.location === selectedLoc;
    const matchType = jobType === "All" || job.type === jobType;
    return matchSearch && matchLoc && matchType;
  });

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showPager   = filtered.length > PAGE_SIZE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900 mb-1">
          {activeCat === "All" ? "Browse Jobs" : activeCat}
        </h1>
        <p className="text-gray-500 text-sm">
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}{" "}
          {activeCat !== "All" ? `in ${activeCat}` : "available in Ethiopia"}
          {isUsingMock && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Sample data
            </span>
          )}
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search jobs by title or skill..."
            className="w-full bg-white border border-gray-200 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {search && (
            <button onClick={() => { setSearch(""); handleSearch(); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button onClick={handleSearch} disabled={isNavigating}
          className="flex items-center justify-center gap-2 px-3 sm:px-5 py-3 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-60 flex-shrink-0"
          aria-label="Search"
        >
          {isNavigating
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Search className="w-4 h-4 sm:hidden" /><span className="hidden sm:inline">Search</span></>
          }
        </button>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
            showFilters ? "bg-green-700 text-white border-green-700" : "bg-white border-gray-200 text-gray-700 hover:border-green-400"
          }`}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">LOCATION</label>
            <select value={selectedLoc} onChange={e => setSelectedLoc(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">JOB TYPE</label>
            <div className="flex gap-2">
              {["All", "Fixed", "Hourly"].map(t => (
                <button key={t} onClick={() => setJobType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    jobType === t ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setSelectedLoc("All Ethiopia"); setJobType("All"); setSearch(""); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-colors">
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Category pills — clicking updates the URL → server refetch */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCatClick(cat)}
            disabled={isNavigating}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${
              activeCat === cat
                ? "bg-green-700 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"
            }`}
          >
            {isNavigating && activeCat !== cat ? cat : cat}
          </button>
        ))}
      </div>

      {/* Loading overlay while navigating */}
      {isNavigating && (
        <div className="flex items-center gap-2 text-sm text-green-700 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading {activeCat === "All" ? "all jobs" : activeCat} …
        </div>
      )}

      {/* Job cards */}
      {paginated.length === 0 && !isNavigating ? (
        <div className="text-center py-20 text-gray-400">
          <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No jobs found</p>
          <p className="text-sm mt-1">Try a different category or clear your filters</p>
          <button onClick={() => handleCatClick("All")}
            className="mt-4 text-sm text-green-700 font-semibold hover:underline">
            View all jobs →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map(job => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group block bg-white border border-gray-100 rounded-2xl p-5 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[job.category] || "bg-gray-100 text-gray-600"}`}>
                      {job.category}
                    </span>
                    {job.urgent && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Urgent</span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.posted}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{job.company}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill: string) => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button onClick={e => e.preventDefault()} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors">
                    <Bookmark className="w-4 h-4 text-gray-400 hover:text-green-600" />
                  </button>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-700">{job.budget}</div>
                    <div className="text-xs text-gray-400">{job.type} Price</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                <span>{job.proposals} proposal{job.proposals !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Pagination — only shows when more than PAGE_SIZE (10) jobs ── */}
      {showPager && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Showing <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of{" "}
            <strong>{filtered.length}</strong> jobs
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => { setPage(item as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === item
                        ? "bg-green-700 text-white"
                        : "border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"
                    }`}
                  >
                    {item}
                  </button>
                )
              )
            }

            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
