"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star, CheckCircle, MessageSquare, Briefcase,
  Clock, Award, ChevronRight, ExternalLink,
  User, Phone, Mail, Calendar, Layers,
} from "lucide-react";

// ─── Types (match getFreelancerProfile return shape) ─────────────────────────

export interface FreelancerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  kycStatus: string;
  createdAt: string | Date;
  profile: {
    id: string;
    userId: string;
    title: string | null;
    bio: string | null;
    skills: string[];
    hourlyRate: number | null;
    rating: number;
    completedJobs: number;
    createdAt: string | Date;
    updatedAt: string | Date;
  } | null;
}

interface FreelancerProfileProps {
  freelancer: FreelancerData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function memberSince(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatRate(rate: number | null): string {
  if (!rate || rate === 0) return "Negotiable";
  return `ETB ${rate.toLocaleString()}/hr`;
}

// Star row helper
function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FreelancerProfile({ freelancer }: FreelancerProfileProps) {
  const [activeTab, setActiveTab] = useState("Overview");

  // Derived values — all from real data with safe fallbacks
  const profile       = freelancer.profile;
  const title         = profile?.title         ?? "Freelancer";
  const bio           = profile?.bio           ?? null;
  const skills        = profile?.skills        ?? [];
  const hourlyRate    = profile?.hourlyRate    ?? null;
  const rating        = profile?.rating        ?? 0;
  const completedJobs = profile?.completedJobs ?? 0;
  const isVerified    = freelancer.kycStatus === "APPROVED";
  const color         = avatarColor(freelancer.name);
  const avatar        = initials(freelancer.name);
  const joined        = memberSince(freelancer.createdAt);

  const tabs = ["Overview", "Portfolio", "Reviews"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/freelancers" className="hover:text-green-700">Freelancers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-600 truncate max-w-xs">{freelancer.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <div className={`w-24 h-24 ${color} rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-md`}>
              {avatar}
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{freelancer.name}</h1>
              {isVerified && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" aria-label="KYC Verified" />
              )}
            </div>

            <p className="text-gray-500 text-sm mb-3">{title}</p>

            {/* Rating */}
            {rating > 0 ? (
              <div className="flex items-center justify-center gap-2 mb-4">
                <StarRow rating={rating} size="md" />
                <span className="font-bold text-gray-800">{rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({completedJobs} jobs)</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No ratings yet</p>
            )}

            {/* CTA buttons */}
            <div className="flex gap-2">
              <Link
                href="/messages"
                className="flex-1 bg-green-700 text-white font-semibold py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
              <Link
                href="/post-job"
                className="flex-1 border border-green-700 text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm flex items-center justify-center"
              >
                Hire Now
              </Link>
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Briefcase className="w-4 h-4 text-green-600" /> Jobs Completed
                </div>
                <span className="text-sm font-semibold text-gray-800">{completedJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Award className="w-4 h-4 text-green-600" /> Member Since
                </div>
                <span className="text-sm font-semibold text-gray-800">{joined}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Layers className="w-4 h-4 text-green-600" /> Skills
                </div>
                <span className="text-sm font-semibold text-gray-800">{skills.length}</span>
              </div>
            </div>
          </div>

          {/* Contact info card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="truncate">{freelancer.email}</span>
              </div>
              {freelancer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{freelancer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Joined {joined}</span>
              </div>
            </div>
          </div>

          {/* KYC status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Verification</h3>
            {isVerified ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Identity Verified (KYC)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User className="w-4 h-4" />
                <span>Not yet verified</span>
              </div>
            )}
          </div>

          {/* Rate card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <div className="text-2xl font-bold text-green-700 mb-1">{formatRate(hourlyRate)}</div>
            <div className="text-sm text-gray-500">Hourly Rate</div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === "Overview" && (
            <>
              {/* Bio */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3">About Me</h2>
                {bio ? (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{bio}</p>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">This freelancer hasn't added a bio yet.</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4">Skills</h2>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No skills listed yet.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Portfolio tab ── */}
          {activeTab === "Portfolio" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-2">Portfolio</h2>
              <p className="text-xs text-gray-400 mb-6">
                Portfolio projects are not yet supported. Coming soon.
              </p>
              <div className="text-center py-12 text-gray-400">
                <ExternalLink className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No portfolio items yet</p>
                <p className="text-xs mt-1">
                  {freelancer.name.split(" ")[0]} hasn't added any portfolio projects.
                </p>
              </div>
            </div>
          )}

          {/* ── Reviews tab ── */}
          {activeTab === "Reviews" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900">Client Reviews</h2>
                {rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRow rating={rating} />
                    <span className="font-bold text-gray-800 text-sm">{rating.toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">({completedJobs} completed)</span>
                  </div>
                )}
              </div>
              <div className="text-center py-12 text-gray-400">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No reviews yet</p>
                <p className="text-xs mt-1">
                  Reviews will appear here after completed jobs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
