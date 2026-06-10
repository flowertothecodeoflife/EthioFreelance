"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Star, MapPin, CheckCircle, SlidersHorizontal,
  X, Users, Briefcase,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FreelancerItem {
  id: string;
  name: string;
  email: string;
  kycStatus: string;
  isOnline: boolean;
  profile: {
    title: string | null;
    bio: string | null;
    skills: string[];
    hourlyRate: number | null;
    rating: number;
    completedJobs: number;
  } | null;
}

interface FreelancersListingProps {
  initialFreelancers?: FreelancerItem[];
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_FREELANCERS: FreelancerItem[] = [
  { id: "mock-1", name: "Abebe Girma",    email: "", kycStatus: "APPROVED", isOnline: true,  profile: { title: "Full Stack Developer",             bio: null, skills: ["React", "Node.js", "Python", "PostgreSQL"],    hourlyRate: 500, rating: 4.9, completedJobs: 124 } },
  { id: "mock-2", name: "Tigist Haile",   email: "", kycStatus: "APPROVED", isOnline: true,  profile: { title: "Graphic Designer & Brand Strategist", bio: null, skills: ["Figma", "Illustrator", "Branding", "UI/UX"],   hourlyRate: 350, rating: 4.8, completedJobs: 89  } },
  { id: "mock-3", name: "Dawit Bekele",   email: "", kycStatus: "APPROVED", isOnline: false, profile: { title: "Amharic-English Translator",          bio: null, skills: ["Amharic", "English", "Legal Docs", "Tigrinya"], hourlyRate: 200, rating: 5.0, completedJobs: 56  } },
  { id: "mock-4", name: "Meron Tadesse",  email: "", kycStatus: "APPROVED", isOnline: true,  profile: { title: "Mobile App Developer",               bio: null, skills: ["Flutter", "Kotlin", "Firebase", "iOS"],         hourlyRate: 600, rating: 4.7, completedJobs: 71  } },
  { id: "mock-5", name: "Yonas Alemu",    email: "", kycStatus: "NONE",     isOnline: true,  profile: { title: "Data Analyst & Excel Expert",         bio: null, skills: ["Excel", "Power BI", "SQL", "Python"],           hourlyRate: 300, rating: 4.9, completedJobs: 48  } },
  { id: "mock-6", name: "Hana Worku",     email: "", kycStatus: "APPROVED", isOnline: true,  profile: { title: "Content Writer & SEO Specialist",     bio: null, skills: ["SEO", "Copywriting", "Amharic", "WordPress"],   hourlyRate: 250, rating: 4.8, completedJobs: 37  } },
  { id: "mock-7", name: "Bereket Solomon",email: "", kycStatus: "APPROVED", isOnline: false, profile: { title: "UI/UX Designer",                      bio: null, skills: ["Figma", "Sketch", "Prototyping"],               hourlyRate: 400, rating: 4.6, completedJobs: 61  } },
  { id: "mock-8", name: "Lidya Tesfaye",  email: "", kycStatus: "APPROVED", isOnline: true,  profile: { title: "Accountant & Financial Analyst",      bio: null, skills: ["Accounting", "QuickBooks", "Tax", "Excel"],     hourlyRate: 350, rating: 4.9, completedJobs: 42  } },
  { id: "mock-9", name: "Natnael Girma",  email: "", kycStatus: "NONE",     isOnline: true,  profile: { title: "Video Editor & Motion Graphics",      bio: null, skills: ["Premiere Pro", "After Effects", "DaVinci"],     hourlyRate: 300, rating: 4.7, completedJobs: 35  } },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_SKILL_MAP: Record<string, string[]> = {
  "IT & Software": ["React", "Node.js", "Python", "SQL", "Flutter", "Kotlin", "Firebase", "WordPress", "PHP", "TypeScript", "Java", "Swift"],
  "Design":        ["Figma", "Illustrator", "Sketch", "UI/UX", "Branding", "Prototyping", "Photoshop", "After Effects"],
  "Writing":       ["Copywriting", "SEO", "WordPress", "Amharic", "Content", "Blogging"],
  "Translation":   ["Amharic", "English", "Tigrinya", "Oromo", "Legal Docs", "Interpretation"],
  "Finance":       ["Accounting", "QuickBooks", "Tax", "Excel", "Power BI", "Bookkeeping"],
  "Video":         ["Premiere Pro", "After Effects", "DaVinci", "Video Editing", "Motion Graphics"],
  "Data":          ["Excel", "Power BI", "SQL", "Python", "Pandas", "Tableau"],
};

const CATEGORIES = ["All Skills", ...Object.keys(CATEGORY_SKILL_MAP)];

const LOCATIONS = ["All Ethiopia", "Remote", "Addis Ababa", "Dire Dawa", "Mekelle", "Hawassa", "Bahir Dar"];

const RATE_RANGES = [
  { label: "Any Rate",          min: 0,    max: Infinity },
  { label: "Under ETB 200/hr",  min: 0,    max: 199      },
  { label: "ETB 200–400/hr",    min: 200,  max: 400      },
  { label: "ETB 400–600/hr",    min: 400,  max: 600      },
  { label: "ETB 600+/hr",       min: 600,  max: Infinity },
];

// ─── Avatar colour derived from name (consistent, no random) ─────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-600", "bg-orange-500",
  "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-emerald-500", "bg-red-500",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatRate(rate: number | null): string {
  if (!rate || rate === 0) return "Rate negotiable";
  return `ETB ${rate.toLocaleString()}/hr`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FreelancersListing({ initialFreelancers = [] }: FreelancersListingProps) {
  // Use real DB data if available, otherwise fall back to mock data
  const source: FreelancerItem[] = initialFreelancers.length > 0 ? initialFreelancers : MOCK_FREELANCERS;
  const isUsingMock = initialFreelancers.length === 0;

  const [search, setSearch]           = useState("");
  const [selectedCat, setSelectedCat] = useState("All Skills");
  const [selectedLoc, setSelectedLoc] = useState("All Ethiopia");
  const [selectedRate, setSelectedRate] = useState("Any Rate");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [sortBy, setSortBy]             = useState("rating");

  const rateRange = RATE_RANGES.find((r) => r.label === selectedRate) ?? RATE_RANGES[0];

  // ── Filter + sort (memoised so it only recalculates when deps change) ────────
  const filtered = useMemo(() => {
    let list = source.filter((f) => {
      const skills = f.profile?.skills ?? [];
      const title  = f.profile?.title  ?? "";
      const rate   = f.profile?.hourlyRate ?? 0;

      // Search: name, title, or any skill
      const matchSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      // Category: check if any of the freelancer's skills match the category's keyword list
      const matchCat =
        selectedCat === "All Skills" ||
        (CATEGORY_SKILL_MAP[selectedCat] ?? []).some((kw) =>
          skills.some((s) => s.toLowerCase().includes(kw.toLowerCase()))
        );

      // Location: DB freelancers don't have a location field — skip this filter for DB data
      // For mock data the location is embedded; for DB data we show all
      const matchLoc =
        selectedLoc === "All Ethiopia" ||
        isUsingMock; // DB freelancers have no location field yet — show all

      // Rate range
      const matchRate = rate >= rateRange.min && rate <= rateRange.max;

      // KYC verified
      const matchVerified = !verifiedOnly || f.kycStatus === "APPROVED";

      // Online / available
      const matchAvailable = !availableOnly || f.isOnline;

      return matchSearch && matchCat && matchLoc && matchRate && matchVerified && matchAvailable;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "rating")       return (b.profile?.rating ?? 0) - (a.profile?.rating ?? 0);
      if (sortBy === "rate-high")    return (b.profile?.hourlyRate ?? 0) - (a.profile?.hourlyRate ?? 0);
      if (sortBy === "rate-low")     return (a.profile?.hourlyRate ?? 0) - (b.profile?.hourlyRate ?? 0);
      if (sortBy === "jobs")         return (b.profile?.completedJobs ?? 0) - (a.profile?.completedJobs ?? 0);
      return 0;
    });

    return list;
  }, [source, search, selectedCat, selectedLoc, rateRange, verifiedOnly, availableOnly, sortBy, isUsingMock]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">Find Freelancers</h1>
        <p className="text-gray-500">
          {filtered.length} verified professional{filtered.length !== 1 ? "s" : ""} available
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, or title..."
            className="w-full bg-white border border-gray-200 pl-12 pr-10 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            showFilters
              ? "bg-green-700 text-white border-green-700"
              : "bg-white border-gray-200 text-gray-700 hover:border-green-400"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">LOCATION</label>
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">HOURLY RATE</label>
            <select
              value={selectedRate}
              onChange={(e) => setSelectedRate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {RATE_RANGES.map((r) => <option key={r.label}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">SORT BY</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="rating">Highest Rated</option>
              <option value="rate-high">Rate: High to Low</option>
              <option value="rate-low">Rate: Low to High</option>
              <option value="jobs">Most Jobs Completed</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 accent-green-600 rounded"
              />
              <span className="text-sm text-gray-700">KYC Verified Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 accent-green-600 rounded"
              />
              <span className="text-sm text-gray-700">Online Now</span>
            </label>
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCat === cat
                ? "bg-green-700 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No freelancers found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term</p>
          <button
            onClick={() => { setSearch(""); setSelectedCat("All Skills"); setSelectedLoc("All Ethiopia"); setSelectedRate("Any Rate"); setVerifiedOnly(false); setAvailableOnly(false); }}
            className="mt-4 text-sm text-green-700 font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((f) => {
            const skills       = f.profile?.skills        ?? [];
            const title        = f.profile?.title         ?? "Freelancer";
            const rating       = f.profile?.rating        ?? 0;
            const completedJobs = f.profile?.completedJobs ?? 0;
            const hourlyRate   = f.profile?.hourlyRate    ?? null;
            const isVerified   = f.kycStatus === "APPROVED";
            const color        = avatarColor(f.name);
            const avatar       = initials(f.name);

            return (
              <Link
                key={f.id}
                href={`/freelancers/${f.id}`}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-green-300 hover:shadow-lg transition-all"
              >
                {/* Avatar + name row */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white font-bold text-lg`}>
                      {avatar}
                    </div>
                    {f.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" title="Online now" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
                        {f.name}
                      </h3>
                      {isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-label="KYC Verified" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{title}</p>
                    {/* DB freelancers don't have location yet — show online status instead */}
                    <div className="flex items-center gap-1 mt-1">
                      {f.isOnline ? (
                        <span className="text-xs text-green-500 font-medium">● Online</span>
                      ) : (
                        <span className="text-xs text-gray-400">● Offline</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                      {skill}
                    </span>
                  ))}
                  {skills.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      +{skills.length - 3}
                    </span>
                  )}
                  {skills.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No skills listed</span>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    {rating > 0 ? (
                      <>
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-sm text-gray-800">{rating.toFixed(1)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No rating yet</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-700">{formatRate(hourlyRate)}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                      <Briefcase className="w-3 h-3" />
                      {completedJobs} job{completedJobs !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
