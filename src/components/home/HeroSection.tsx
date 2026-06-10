"use client";
import { useState } from "react";
import { Search, MapPin, TrendingUp, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

const popularSearches = [
  "Web Developer", "Graphic Designer", "Amharic Translator", "Data Entry",
  "Video Editor", "Accountant", "Tutor", "Content Writer",
];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "freelancers">("jobs");
  const { theme } = useTheme();

  const isDark = theme === "dark";

  return (
    <section className="relative text-white overflow-hidden">
      {/* ── Background image — crossfades when theme changes ── */}
      {/* Day image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: "url('/hero-bg-day.png')",
          opacity: isDark ? 0 : 1,
        }}
      />
      {/* Night image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: "url('/hero-bg-night.png')",
          opacity: isDark ? 1 : 0,
        }}
      />
      {/* Dark overlay — slightly stronger at night for readability */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.55)" }}
      />
      {/* Green brand tint */}
      <div className="absolute inset-0 bg-green-950/25" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-green-800/60 border border-green-600 rounded-full px-4 py-1.5 text-sm text-green-300 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Ethiopia&apos;s #1 Freelancing Platform 🇪🇹
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Find Top Ethiopian{" "}
            <span className="text-green-400">Freelancers</span>{" "}
            or Land Your Next{" "}
            <span className="text-green-400">Dream Job</span>
          </h1>

          <p className="text-green-200 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            ከምርጥ ኢትዮጵያዊ ፍሪላንሰሮች ጋር ይገናኙ። Pay securely with Chapa. Work in Amharic or English.
          </p>

          {/* Search Tabs */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 inline-flex gap-1 mb-6">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "jobs"
                  ? "bg-white text-green-900"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Find Jobs
            </button>
            <button
              onClick={() => setActiveTab("freelancers")}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "freelancers"
                  ? "bg-white text-green-900"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Find Freelancers
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === "jobs"
                    ? "Search for jobs (e.g. Web Developer, Translator...)"
                    : "Search for freelancers by skill..."
                }
                className="w-full bg-white text-gray-800 pl-12 pr-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
              />
            </div>
            <div className="relative sm:w-44">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select className="w-full bg-white text-gray-800 pl-9 pr-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg appearance-none">
                <option>All Ethiopia</option>
                <option>Addis Ababa</option>
                <option>Dire Dawa</option>
                <option>Mekelle</option>
                <option>Hawassa</option>
                <option>Bahir Dar</option>
                <option>Remote</option>
              </select>
            </div>
            <Link
              href={`/${activeTab === "jobs" ? "jobs" : "freelancers"}?q=${encodeURIComponent(query)}`}
              className="bg-green-400 text-green-900 font-bold px-8 py-4 rounded-xl hover:bg-green-300 transition-colors shadow-lg text-sm whitespace-nowrap"
            >
              Search
            </Link>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <span className="text-green-300 text-sm">Popular:</span>
            {popularSearches.map((term) => (
              <Link
                key={term}
                href={`/jobs?q=${encodeURIComponent(term)}`}
                className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-green-300">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Secure Chapa Payments
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              10,000+ Active Jobs
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              Hire in 24 Hours
            </div>
          </div>
        </div>
      </div>

      {/* Fade transition to glass content below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))",
        }}
      />
    </section>
  );
}
