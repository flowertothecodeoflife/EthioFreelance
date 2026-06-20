"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase, DollarSign, Star, TrendingUp, Clock, CheckCircle,
  MessageSquare, Bell, Plus, Eye, ChevronRight, Award, Wallet,
  Loader2, AlertCircle, ArrowUpCircle, Link as LinkIcon,
} from "lucide-react";
import { releaseEscrowPayment } from "@/app/actions/payment";
import { useTranslations } from "next-intl";
interface DashboardProps {
  data?: {
    user: {
      name: string;
      role: string;
      kycStatus: string;
      email: string;
    };
    stats: {
      totalEarned: number;
      activeJobsCount: number;
      completedJobsCount: number;
      rating: number;
    };
    jobs: any[];
    proposals: any[];
    transactions: any[];
    walletBalance?: number;
  };
}

const tabs = ["Overview", "My Jobs", "Proposals", "Earnings", "Messages"];

const mockJobs = [
  { id: "mock-1", title: "E-commerce Website Development", client: "TechEthio", status: "In Progress", budget: "ETB 20,000", deadline: "Dec 15", progress: 65 },
  { id: "mock-2", title: "Logo Design for Restaurant", client: "Habesha Kitchen", status: "Completed", budget: "ETB 4,500", deadline: "Nov 30", progress: 100 },
  { id: "mock-3", title: "Amharic Content Writing", client: "EthioMedia", status: "Pending Review", budget: "ETB 3,000", deadline: "Dec 20", progress: 90 },
];

const mockProposals = [
  { id: "mock-p-1", job: "Mobile App Developer – Android", bid: "ETB 35,000", status: "Shortlisted", date: "2 days ago" },
  { id: "mock-p-2", job: "Data Entry – NGO Survey", bid: "ETB 8,000", status: "Pending", date: "3 days ago" },
  { id: "mock-p-3", job: "Python Data Analyst", bid: "ETB 15,000", status: "Rejected", date: "5 days ago" },
];

const statusColors: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  "Completed": "bg-green-100 text-green-700",
  "Pending Review": "bg-yellow-100 text-yellow-700",
  "Shortlisted": "bg-green-100 text-green-700",
  "Pending": "bg-gray-100 text-gray-600",
  "Rejected": "bg-red-100 text-red-600",
  "OPEN": "bg-green-100 text-green-700",
  "IN_PROGRESS": "bg-blue-100 text-blue-700",
  "COMPLETED": "bg-teal-100 text-teal-700",
  "CANCELLED": "bg-red-100 text-red-600",
  "ACCEPTED": "bg-green-100 text-green-700",
  "SHORTLISTED": "bg-blue-100 text-blue-700",
  "REJECTED": "bg-red-100 text-red-600",
};

export default function Dashboard({ data }: DashboardProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  // Stable keys for state comparison — translated labels for display
  const tabKeys   = ["Overview", "My Jobs", "Proposals", "Earnings", "Messages"] as const;
  const tabLabels = [
    t("tabs.overview"),
    t("tabs.jobs"),
    t("tabs.proposals"),
    t("tabs.wallet"),   // "Earnings" → wallet namespace key
    t("tabs.messages"),
  ];
  const [activeTab, setActiveTab] = useState<typeof tabKeys[number]>("Overview");
  const [releasingJobId, setReleasingJobId] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccess, setReleaseSuccess] = useState<string | null>(null);
  const [confirmJobId, setConfirmJobId] = useState<string | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Pagination state
  const PAGE_SIZE = 5;
  const [jobsPage, setJobsPage]       = useState(1);
  const [propsPage, setPropsPage]     = useState(1);
  const [txPage, setTxPage]           = useState(1);

  // ── Release escrow handler ──────────────────────────────────────────────────
  const handleRelease = (jobId: string) => {
    setReleaseError("");
    setReleasingJobId(jobId);
    setConfirmJobId(null);
    startTransition(async () => {
      const res = await releaseEscrowPayment(jobId);
      setReleasingJobId(null);
      if (res.error) {
        setReleaseError(res.error);
      } else {
        setReleaseSuccess(jobId);
      }
    });
  };

  // Determine user parameters
  const isDemo = !data;
  const userName = data?.user?.name || "Abebe Kebede";
  const userRole = data?.user?.role || "FREELANCER";
  const isClient = userRole === "CLIENT";
  const isVerified = data ? data.user.kycStatus === "APPROVED" : true;
  const ratingValue = data?.stats?.rating ?? 4.9;

  // Format initials
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Dynamic lists mapping
  // isDemo = no data prop = unauthenticated/preview mode only
  // Real logged-in users always get real data (empty arrays if new user — never mock)
  const activeJobs = !isDemo
    ? isClient
      ? data.jobs.map(j => ({
          id: j.id,
          title: j.title,
          client: "Me (Client)",
          status: j.status,
          budget: `ETB ${j.budget.toLocaleString()}`,
          deadline: new Date(j.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          progress: j.status === "COMPLETED" ? 100 : j.status === "IN_PROGRESS" ? 50 : 0,
          escrowFunded: Array.isArray(j.transactions) && j.transactions.some((t: any) => t.status === "COMPLETED"),
          freelancerName:   j.proposals?.[0]?.freelancer?.name ?? null,
          freelancerAmount: j.proposals?.[0]?.bidAmount ?? j.budget,
        }))
      : data.proposals.filter(p => p.status === "ACCEPTED").map(p => ({
          id: p.id,
          title: p.job.title,
          client: p.job.client?.name || "Client",
          status: "In Progress",
          budget: `ETB ${p.bidAmount.toLocaleString()}`,
          deadline: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          progress: 50,
          escrowFunded: false,
        }))
    : mockJobs.map(j => ({ ...j, escrowFunded: false }));

  const activeProposals = !isDemo
    ? data.proposals.map(p => {
        const timeDiff = Date.now() - new Date(p.createdAt).getTime();
        const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const dateStr = diffDays === 0 ? "Today" : diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
        return {
          id: p.id,
          jobId: p.job?.id ?? "",
          job: p.job.title,
          bid: `ETB ${p.bidAmount.toLocaleString()}`,
          status: p.status,
          date: dateStr
        };
      })
    : mockProposals;

  const activeTransactions = !isDemo
    ? data.transactions.map(t => ({
        desc: t.type === "ESCROW_DEPOSIT" ? "Escrow Deposit" : t.type === "ESCROW_RELEASE" ? "Escrow Released" : "Withdrawal",
        amount: (t.type === "ESCROW_DEPOSIT" ? "-" : "+") + `ETB ${t.amount.toLocaleString()}`,
        date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        type: t.type === "ESCROW_DEPOSIT" ? "debit" : "credit"
      }))
    : [
        { desc: "E-commerce Website – Milestone 2", amount: "+ETB 8,000", date: "Dec 1", type: "credit" },
        { desc: "Platform Fee (1%)", amount: "-ETB 80", date: "Dec 1", type: "debit" },
        { desc: "Logo Design – Final Payment", amount: "+ETB 4,500", date: "Nov 30", type: "credit" },
        { desc: "Withdrawal to CBE", amount: "-ETB 10,000", date: "Nov 28", type: "debit" },
      ];

  const totalEarnedStr = !isDemo
    ? `ETB ${data.stats.totalEarned.toLocaleString()}`
    : "ETB 124,500";

  // Real wallet balance from server — freelancer: earned balance; client: pending escrow
  const walletBalanceNum = !isDemo ? (data.walletBalance ?? 0) : (isClient ? 0 : 12400);
  const walletBalance = `ETB ${walletBalanceNum.toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-inner">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("greeting", { name: userName.split(" ")[0] })} 👋</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <CheckCircle className={`w-4 h-4 ${isVerified ? "text-green-500" : "text-gray-400"}`} />
              <span>{isVerified ? tc("verified") : "Unverified"} {isClient ? "Client" : "Freelancer"}</span>
              <span>•</span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{ratingValue} Rating</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/messages" className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:border-green-400 transition-colors">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </Link>
          <Link href="#notifications" className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:border-green-400 transition-colors" title="View notifications in the top bar">
            <Bell className="w-5 h-5 text-gray-600" />
          </Link>
          {isClient ? (
            <Link href="/post-job" className="flex items-center gap-2 bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm shadow-md">
              <Plus className="w-4 h-4" /> {t("jobs.postNew")}
            </Link>
          ) : (
            <Link href="/jobs" className="flex items-center gap-2 bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm shadow-md">
              <Plus className="w-4 h-4" /> {t("tabs.jobs")}
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards — reduced padding/font on mobile to prevent value overflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          {
            icon: DollarSign,
            label: isClient ? t("stats.totalSpent") : t("stats.totalEarned"),
            value: totalEarnedStr,
            sub: isClient ? "All time project spend" : "+ETB 8,000 this month",
            color: "text-green-600",
            bg: "bg-green-50"
          },
          {
            icon: Briefcase,
            label: isClient ? t("stats.activeJobs") : t("stats.activeProposals"),
            value: data?.stats?.activeJobsCount.toString() || "0",
            sub: isClient ? "Active listings" : "Current contracts",
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            icon: CheckCircle,
            label: t("stats.completedJobs"),
            value: data?.stats?.completedJobsCount.toString() || "0",
            sub: "All time",
            color: "text-teal-600",
            bg: "bg-teal-50"
          },
          {
            icon: Star,
            label: t("stats.successRate"),
            value: ratingValue.toString(),
            sub: isClient ? "Client rating" : "Freelancer rating",
            color: "text-yellow-500",
            bg: "bg-yellow-50"
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-3.5 sm:p-5 border border-gray-100 shadow-sm overflow-hidden">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-0.5 truncate">{value}</div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">{label}</div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabKeys.map((key, i) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabels[i]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Jobs */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{isClient ? t("jobs.postNew") : t("tabs.jobs")}</h2>
              <button onClick={() => setActiveTab("My Jobs")} className="text-sm text-green-700 hover:underline flex items-center gap-1 font-semibold">
                {t("pagination.next")} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {isClient ? "No jobs posted yet" : "No active jobs yet"}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    {isClient
                      ? "Post your first job and start receiving proposals from verified freelancers."
                      : "Browse open jobs and submit your first proposal to get started."}
                  </p>
                  <Link
                    href={isClient ? "/post-job" : "/jobs"}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isClient ? "Post a Job" : "Browse Jobs"}
                  </Link>
                </div>
              ) : (
                activeJobs.slice(0, 3).map((job: any) => (
                  <div key={job.id} className="border border-gray-100 rounded-xl p-4 hover:border-green-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                        <p className="text-xs text-gray-500">{job.client}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray-600"}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{job.progress}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.budget}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Updated {job.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Wallet */}
            <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-green-300" />
                <span className="text-sm text-green-300">Escrow Wallet</span>
              </div>
              <div className="text-3xl font-bold mb-1">{walletBalance}</div>
              <div className="text-green-300 text-xs mb-4">Secured escrow protection</div>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 rounded-xl text-sm transition-colors backdrop-blur-sm text-center block"
              >
                Withdraw to Bank
              </button>
            </div>

            {/* Profile Completion */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900 text-sm">Profile Strength</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "90%" }}></div>
                </div>
                <span className="text-sm font-bold text-green-700">90%</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Your profile is looking great! Complete identity KYC to boost visibility.</p>
              <Link href="/profile" className="text-sm text-green-700 font-semibold hover:underline flex items-center gap-1">
                Complete Profile <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Recent Proposals */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Recent Proposals</h3>
              <div className="space-y-3">
                {activeProposals.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No proposals submitted yet.</p>
                ) : (
                  activeProposals.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{p.job}</p>
                        <p className="text-[10px] text-gray-400">{p.date}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "My Jobs" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{isClient ? "My Posted Jobs" : "My Contract Jobs"}</h2>
          <div className="space-y-4">
            {activeJobs.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold text-gray-700 mb-1">
                  {isClient ? "You haven't posted any jobs yet" : "No contract jobs yet"}
                </p>
                <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
                  {isClient
                    ? "Create your first job listing to connect with skilled Ethiopian freelancers."
                    : "Once a client accepts your proposal, your active jobs will appear here."}
                </p>
                <Link
                  href={isClient ? "/post-job" : "/jobs"}
                  className="inline-flex items-center gap-2 bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {isClient ? "Post Your First Job" : "Find Jobs to Apply"}
                </Link>
              </div>
            ) : (
              <>
                {activeJobs.slice((jobsPage - 1) * PAGE_SIZE, jobsPage * PAGE_SIZE).map((job: any) => {
                const isInProgress = job.status === "IN_PROGRESS";
                const canRelease   = isClient && isInProgress && job.escrowFunded;
                const needsFunding = isClient && isInProgress && !job.escrowFunded;
                const isReleasing  = releasingJobId === job.id;
                const wasReleased  = releaseSuccess === job.id;

                return (
                  <div key={job.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:border-green-200 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{job.title}</h3>
                      <p className="text-xs text-gray-500">{job.client} • {job.budget}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        wasReleased ? "bg-teal-100 text-teal-700" : (statusColors[job.status] || "bg-gray-100 text-gray-600")
                      }`}>
                        {wasReleased ? "COMPLETED" : job.status}
                      </span>
                      {needsFunding && !wasReleased && (
                        <Link href={`/jobs/${job.id}`} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                          <Wallet className="w-3 h-3" /> Fund Escrow
                        </Link>
                      )}
                      {canRelease && !wasReleased && (
                        <button type="button" disabled={isReleasing} onClick={() => setConfirmJobId(job.id)}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-60">
                          {isReleasing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpCircle className="w-3 h-3" />}
                          {isReleasing ? "Releasing..." : "Release"}
                        </button>
                      )}
                      {wasReleased && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-600">
                          <CheckCircle className="w-3 h-3" /> Released
                        </span>
                      )}
                      <Link href={`/jobs/${job.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-green-700" />
                      </Link>
                    </div>
                  </div>
                );
              })}
                {/* Jobs pagination */}
                {activeJobs.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {(jobsPage - 1) * PAGE_SIZE + 1}–{Math.min(jobsPage * PAGE_SIZE, activeJobs.length)} of {activeJobs.length}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setJobsPage(p => Math.max(1, p - 1))} disabled={jobsPage === 1}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                        ← Prev
                      </button>
                      <button onClick={() => setJobsPage(p => Math.min(Math.ceil(activeJobs.length / PAGE_SIZE), p + 1))}
                        disabled={jobsPage >= Math.ceil(activeJobs.length / PAGE_SIZE)}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "Earnings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Escrow & Financials</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "This Month", value: isDemo ? "ETB 8,000" : totalEarnedStr, icon: TrendingUp, color: "text-green-600" },
                { label: "Pending Escrow", value: isDemo ? "ETB 12,500" : walletBalance, icon: DollarSign, color: "text-blue-600" },
                { label: "All-Time Total", value: totalEarnedStr, icon: Award, color: "text-purple-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                  <div className="font-bold text-gray-900 text-sm sm:text-base">{value}</div>
                  <div className="text-[10px] text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Escrow Ledger History</h3>
              {activeTransactions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No transactions found.</p>
              ) : (
                <>
                  {activeTransactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{tx.desc}</p>
                        <p className="text-[10px] text-gray-400">{tx.date}</p>
                      </div>
                      <span className={`font-semibold text-xs ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                  {activeTransactions.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400">
                        {(txPage - 1) * PAGE_SIZE + 1}–{Math.min(txPage * PAGE_SIZE, activeTransactions.length)} of {activeTransactions.length}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Prev</button>
                        <button onClick={() => setTxPage(p => Math.min(Math.ceil(activeTransactions.length / PAGE_SIZE), p + 1))}
                          disabled={txPage >= Math.ceil(activeTransactions.length / PAGE_SIZE)}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-5 text-white h-fit shadow-md">
            <Wallet className="w-8 h-8 text-green-300 mb-3" />
            <div className="text-sm text-green-300 mb-1">Available balance</div>
            <div className="text-4xl font-bold mb-4">{walletBalance}</div>
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(true)}
              className="w-full bg-white text-green-800 font-bold py-3 rounded-xl hover:bg-green-50 transition-colors mb-2 text-sm shadow-md"
            >
              Withdraw Funds
            </button>
            <p className="text-[10px] text-green-300 text-center">Escrow payouts are secured by Chapa Gateway</p>
          </div>
        </div>
      )}

      {activeTab === "Proposals" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Proposals Submissions</h2>
          <div className="space-y-4">
            {activeProposals.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold text-gray-700 mb-1">No proposals yet</p>
                <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
                  Find a job that matches your skills and submit your first proposal. It only takes a few minutes.
                </p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Browse Jobs
                </Link>
              </div>
            ) : (
              <>
                {activeProposals.slice((propsPage - 1) * PAGE_SIZE, propsPage * PAGE_SIZE).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:border-green-200 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{p.job}</h3>
                      <p className="text-xs text-gray-500">Bid: {p.bid} • {p.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                      <Link href={`/jobs/${p.jobId ?? ""}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-green-700" />
                      </Link>
                    </div>
                  </div>
                ))}
                {activeProposals.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {(propsPage - 1) * PAGE_SIZE + 1}–{Math.min(propsPage * PAGE_SIZE, activeProposals.length)} of {activeProposals.length}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setPropsPage(p => Math.max(1, p - 1))} disabled={propsPage === 1}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Prev</button>
                      <button onClick={() => setPropsPage(p => Math.min(Math.ceil(activeProposals.length / PAGE_SIZE), p + 1))}
                        disabled={propsPage >= Math.ceil(activeProposals.length / PAGE_SIZE)}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "Messages" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="font-bold text-gray-900 mb-2">Live Chat Conversations</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Your secure communication workspace. Discuss project details, share links, and schedule calls directly in real time.
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 mt-4 bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm shadow-md"
          >
            Open Messages Workspace
          </Link>
          {/* Auto-redirect hint */}
          <p className="text-xs text-gray-400 mt-3">You will be taken to the full messages page.</p>
        </div>
      )}

      {/* ── Release error banner ── */}
      {releaseError && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {releaseError}
          <button onClick={() => setReleaseError("")} className="ml-auto text-red-400 hover:text-red-700 font-bold text-xs uppercase">✕</button>
        </div>
      )}

      {/* ── Release confirm modal ── */}
      {confirmJobId && (() => {
        const job = activeJobs.find((j: any) => j.id === confirmJobId) as any;
        const freelancerName   = job?.freelancerName   ?? "the freelancer";
        const releaseAmount    = job?.freelancerAmount
          ? `ETB ${Number(job.freelancerAmount).toLocaleString()}`
          : job?.budget ?? "the escrowed amount";
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowUpCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-center mb-2">Release Payment?</h3>
              {/* Freelancer + amount details */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-center">
                <p className="text-sm text-green-800 font-semibold">{freelancerName}</p>
                <p className="text-xl font-bold text-green-700 mt-0.5">{releaseAmount}</p>
              </div>
              <p className="text-sm text-gray-500 text-center mb-5">
                This will release the escrowed funds to <strong>{freelancerName}</strong> and mark the job as <strong>Completed</strong>. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmJobId(null)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button onClick={() => handleRelease(confirmJobId)} disabled={releasingJobId === confirmJobId}
                  className="flex-1 bg-green-700 text-white font-bold py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {releasingJobId === confirmJobId
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Releasing...</>
                    : <><ArrowUpCircle className="w-4 h-4" /> Confirm Release</>
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ── Withdraw modal ── */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-2">Withdraw Funds</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Direct bank withdrawals are coming soon. Currently, escrow funds are released when a client marks a job as complete.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-center">
              <p className="text-xs text-blue-700 font-medium">Your current balance</p>
              <p className="text-2xl font-bold text-blue-800 mt-0.5">{walletBalance}</p>
            </div>
            <p className="text-xs text-gray-400 text-center mb-5">
              To receive payment, ensure your jobs are completed and the client has released escrow. Bank withdrawal (CBE, Awash, Telebirr) will be available soon.
            </p>
            <button
              onClick={() => setWithdrawModalOpen(false)}
              className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
