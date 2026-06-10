"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Users, Briefcase, DollarSign, AlertTriangle, TrendingUp,
  CheckCircle, XCircle, Eye, Shield, Flag, BarChart3,
  Search, Trash2, Loader2, ChevronDown, X, UserCheck,
  UserX, Clock, Filter, RefreshCw, AlertCircle,
  MapPin, Tag, RotateCcw, Ban, Unlock,
  CreditCard, ArrowDownCircle, ArrowUpCircle, Wallet,
} from "lucide-react";
import { updateKycStatus, deleteUser, updateJobStatus, releaseEscrow } from "@/app/actions/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  kycStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  isOnline: boolean;
  createdAt: string | Date;
  _count: { jobs: number; proposals: number };
}

interface DashboardStats {
  // Users
  totalUsers: number;
  totalFreelancers: number;
  totalClients: number;
  pendingKyc: number;
  // Jobs
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  totalProposals: number;
  // Payments
  gmv: number;
  escrowPending: number;
  txCompleted: number;
  txPending: number;
  // Disputes
  openDisputes: number;
}

// ─── AdminJob type (matches getAllJobs return shape) ──────────────────────────

export interface AdminJob {
  id: string;
  title: string;
  description: string;
  budget: number;
  type: "FIXED" | "HOURLY";
  location: string;
  category: string;
  skills: string[];
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string | Date;
  updatedAt: string | Date;
  client: {
    id: string;
    name: string;
    email: string;
    kycStatus: string;
  };
  _count: { proposals: number };
}

// ─── AdminTransaction type (matches getAllTransactions return shape) ───────────

export interface AdminTransaction {
  id: string;
  amount: number;
  type: "ESCROW_DEPOSIT" | "ESCROW_RELEASE" | "WITHDRAWAL";
  status: "PENDING" | "COMPLETED" | "FAILED";
  chapaRef: string | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  job: {
    id: string;
    title: string;
    status: string;
  };
}

interface AdminDashboardProps {
  initialUsers?:        AdminUser[];
  initialJobs?:         AdminJob[];
  initialTransactions?: AdminTransaction[];
  stats?:               DashboardStats | null;
}

// ─── Static mock data (disputes, fraud alerts — no DB model yet) ──────────────

const MOCK_DISPUTES = [
  { id: 1, job: "E-commerce Website",  client: "TechEthio",      freelancer: "Abebe G.",  amount: "ETB 20,000", status: "Open",         priority: "High"   },
  { id: 2, job: "Logo Design",         client: "Habesha Kitchen", freelancer: "Tigist H.", amount: "ETB 4,500",  status: "Under Review", priority: "Medium" },
  { id: 3, job: "Data Entry",          client: "UNICEF",          freelancer: "Yonas A.",  amount: "ETB 8,000",  status: "Resolved",     priority: "Low"    },
];

const MOCK_FRAUD = [
  { type: "Duplicate Account",  user: "user_9823", severity: "High",   time: "2h ago" },
  { type: "Suspicious Bidding", user: "user_4521", severity: "Medium", time: "5h ago" },
  { type: "Payment Anomaly",    user: "user_7734", severity: "High",   time: "1d ago" },
];

// ─── Style maps ───────────────────────────────────────────────────────────────

const KYC_STYLES: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING:  "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-600",
  NONE:     "bg-gray-100 text-gray-500",
};

const ROLE_STYLES: Record<string, string> = {
  CLIENT:     "bg-blue-100 text-blue-700",
  FREELANCER: "bg-purple-100 text-purple-700",
  ADMIN:      "bg-gray-800 text-white",
};

const DISPUTE_STYLES: Record<string, string> = {
  "Open":         "bg-red-100 text-red-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  "Resolved":     "bg-green-100 text-green-700",
  "High":         "bg-red-100 text-red-700",
  "Medium":       "bg-yellow-100 text-yellow-700",
  "Low":          "bg-gray-100 text-gray-600",
};

const JOB_STATUS_STYLES: Record<string, string> = {
  OPEN:        "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-teal-100 text-teal-700",
  CANCELLED:   "bg-red-100 text-red-600",
};

const TX_STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED:    "bg-red-100 text-red-600",
};

const TX_TYPE_STYLES: Record<string, string> = {
  ESCROW_DEPOSIT:  "bg-blue-100 text-blue-700",
  ESCROW_RELEASE:  "bg-teal-100 text-teal-700",
  WITHDRAWAL:      "bg-purple-100 text-purple-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const TABS = ["Overview", "Users", "Jobs", "Disputes", "Payments", "Analytics"];

// ─── PaymentsTab component ────────────────────────────────────────────────────

function PaymentsTab({ initialTransactions }: { initialTransactions: AdminTransaction[] }) {
  const [transactions, setTransactions] = useState<AdminTransaction[]>(initialTransactions);
  const [search, setSearch]             = useState("");
  const [typeFilter, setTypeFilter]     = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pendingId, setPendingId]       = useState<string | null>(null);
  const [actionError, setActionError]   = useState("");
  const [, startTransition]             = useTransition();

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !search ||
        tx.user.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.job.title.toLowerCase().includes(search.toLowerCase()) ||
        (tx.chapaRef ?? "").toLowerCase().includes(search.toLowerCase());
      const matchType   = typeFilter   === "ALL" || tx.type   === typeFilter;
      const matchStatus = statusFilter === "ALL" || tx.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  // ── Summary totals ──────────────────────────────────────────────────────────
  const totalEscrowHeld     = transactions.filter(t => t.type === "ESCROW_DEPOSIT"  && t.status === "PENDING").reduce((s, t) => s + t.amount, 0);
  const totalReleased       = transactions.filter(t => t.type === "ESCROW_RELEASE"  && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn      = transactions.filter(t => t.type === "WITHDRAWAL"      && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
  const pendingCount        = transactions.filter(t => t.status === "PENDING").length;

  // ── Release escrow ──────────────────────────────────────────────────────────
  const handleRelease = (txId: string) => {
    setActionError("");
    setPendingId(txId);

    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId ? { ...t, type: "ESCROW_RELEASE" as const, status: "COMPLETED" as const } : t
      )
    );

    startTransition(async () => {
      const res = await releaseEscrow(txId);
      setPendingId(null);
      if (res.error) {
        setTransactions(initialTransactions);
        setActionError(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Wallet,          label: "Escrow Held",      value: `ETB ${totalEscrowHeld.toLocaleString()}`,  color: "text-blue-600",   bg: "bg-blue-50"   },
          { icon: ArrowUpCircle,   label: "Total Released",   value: `ETB ${totalReleased.toLocaleString()}`,    color: "text-teal-600",   bg: "bg-teal-50"   },
          { icon: ArrowDownCircle, label: "Total Withdrawn",  value: `ETB ${totalWithdrawn.toLocaleString()}`,   color: "text-purple-600", bg: "bg-purple-50" },
          { icon: Clock,           label: "Pending Actions",  value: pendingCount.toString(),                    color: "text-yellow-600", bg: "bg-yellow-50" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, job, or Chapa ref..."
                className="w-full border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-200 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="ESCROW_DEPOSIT">Escrow Deposit</option>
                <option value="ESCROW_RELEASE">Escrow Release</option>
                <option value="WITHDRAWAL">Withdrawal</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mt-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {actionError}
              <button onClick={() => setActionError("")} className="ml-auto text-red-400 hover:text-red-700 text-xs font-bold uppercase">dismiss</button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Showing <strong>{filtered.length}</strong> of <strong>{transactions.length}</strong> transactions
          </p>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No transactions match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Job</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Chapa Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tx) => {
                  const isLoading = pendingId === tx.id;
                  const canRelease = tx.type === "ESCROW_DEPOSIT" && tx.status === "PENDING";

                  return (
                    <tr key={tx.id} className={`hover:bg-gray-50/50 transition-colors ${isLoading ? "opacity-60" : ""}`}>
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials(tx.user.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate max-w-[130px]">{tx.user.name}</div>
                            <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${ROLE_STYLES[tx.user.role]}`}>
                              {tx.user.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-700 truncate max-w-[150px]">{tx.job.title}</div>
                        <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${JOB_STATUS_STYLES[tx.job.status]}`}>
                          {tx.job.status.replace("_", " ")}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TX_TYPE_STYLES[tx.type]}`}>
                          {tx.type.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">
                          ETB {tx.amount.toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TX_STATUS_STYLES[tx.status]}`}>
                          {tx.status}
                        </span>
                      </td>

                      {/* Chapa ref */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-xs text-gray-400 font-mono truncate max-w-[120px]">
                          {tx.chapaRef ?? "—"}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(tx.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : canRelease ? (
                            <button
                              onClick={() => handleRelease(tx.id)}
                              title="Release escrow to freelancer"
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                              Release
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300 italic">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JobsTab component ────────────────────────────────────────────────────────

function JobsTab({ initialJobs }: { initialJobs: AdminJob[] }) {
  const [jobs, setJobs]               = useState<AdminJob[]>(initialJobs);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter]   = useState("ALL");
  const [pendingId, setPendingId]     = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [, startTransition]           = useTransition();

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.client.name.toLowerCase().includes(search.toLowerCase()) ||
        j.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || j.status === statusFilter;
      const matchType   = typeFilter   === "ALL" || j.type   === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [jobs, search, statusFilter, typeFilter]);

  // ── Status update ───────────────────────────────────────────────────────────
  const handleStatusChange = (
    jobId: string,
    newStatus: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) => {
    setActionError("");
    setPendingId(jobId);

    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    startTransition(async () => {
      const res = await updateJobStatus(jobId, newStatus);
      setPendingId(null);
      if (res.error) {
        setJobs(initialJobs); // roll back
        setActionError(res.error);
      }
    });
  };

  // ── Summary counts ──────────────────────────────────────────────────────────
  const counts = {
    OPEN:        jobs.filter((j) => j.status === "OPEN").length,
    IN_PROGRESS: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    COMPLETED:   jobs.filter((j) => j.status === "COMPLETED").length,
    CANCELLED:   jobs.filter((j) => j.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).filter(s => s !== "ALL").map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl p-3 text-left border transition-all ${
              statusFilter === s ? "border-green-400 bg-green-50" : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <div className={`text-xl font-bold ${statusFilter === s ? "text-green-700" : "text-gray-800"}`}>
              {counts[s]}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{s.replace("_", " ")}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, client, or category..."
                className="w-full border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Type filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-200 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="FIXED">Fixed Price</option>
                <option value="HOURLY">Hourly</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Error banner */}
          {actionError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mt-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {actionError}
              <button onClick={() => setActionError("")} className="ml-auto text-red-400 hover:text-red-700 text-xs font-bold uppercase">dismiss</button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Showing <strong>{filtered.length}</strong> of <strong>{jobs.length}</strong> jobs
          </p>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No jobs match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Proposals</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Posted</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((job) => {
                  const isLoading  = pendingId === job.id;
                  const isExpanded = expandedId === job.id;

                  return (
                    <>
                      <tr
                        key={job.id}
                        className={`hover:bg-gray-50/50 transition-colors ${isLoading ? "opacity-60" : ""}`}
                      >
                        {/* Title + category */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : job.id)}
                              className="mt-0.5 p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate max-w-[200px]">{job.title}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{job.category}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{job.type}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-700 font-medium truncate max-w-[120px]">{job.client.name}</div>
                          <div className={`text-[10px] mt-0.5 font-semibold px-1.5 py-0.5 rounded-full inline-block ${
                            job.client.kycStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {job.client.kycStatus}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${JOB_STATUS_STYLES[job.status]}`}>
                            {job.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Budget */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="text-sm font-semibold text-green-700">
                            ETB {job.budget.toLocaleString()}
                            {job.type === "HOURLY" && <span className="text-gray-400 font-normal">/hr</span>}
                          </div>
                        </td>

                        {/* Proposals */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {job._count.proposals}
                          </div>
                        </td>

                        {/* Posted */}
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(job.createdAt)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <>
                                {/* Reopen — only if cancelled or completed */}
                                {(job.status === "CANCELLED" || job.status === "COMPLETED") && (
                                  <button
                                    onClick={() => handleStatusChange(job.id, "OPEN")}
                                    title="Reopen job"
                                    className="p-1.5 hover:bg-green-50 rounded-lg transition-colors group"
                                  >
                                    <Unlock className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                                  </button>
                                )}

                                {/* Mark completed — only if open or in progress */}
                                {(job.status === "OPEN" || job.status === "IN_PROGRESS") && (
                                  <button
                                    onClick={() => handleStatusChange(job.id, "COMPLETED")}
                                    title="Mark as completed"
                                    className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors group"
                                  >
                                    <CheckCircle className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                                  </button>
                                )}

                                {/* Cancel — only if not already cancelled */}
                                {job.status !== "CANCELLED" && (
                                  <button
                                    onClick={() => handleStatusChange(job.id, "CANCELLED")}
                                    title="Cancel job"
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                                  >
                                    <Ban className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row — description + skills */}
                      {isExpanded && (
                        <tr key={`${job.id}-expanded`} className="bg-gray-50/60">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{job.description}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Skills Required</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {job.skills.length > 0
                                    ? job.skills.map((s) => (
                                        <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">{s}</span>
                                      ))
                                    : <span className="text-xs text-gray-400 italic">No skills listed</span>
                                  }
                                </div>
                                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                                  <MapPin className="w-3 h-3" /> {job.location}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UsersTab component ───────────────────────────────────────────────────────

function UsersTab({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers]           = useState<AdminUser[]>(initialUsers);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [kycFilter, setKycFilter]   = useState("ALL");
  const [pendingId, setPendingId]   = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionError, setActionError]     = useState("");
  const [, startTransition] = useTransition();

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchKyc  = kycFilter  === "ALL" || u.kycStatus === kycFilter;
      return matchSearch && matchRole && matchKyc;
    });
  }, [users, search, roleFilter, kycFilter]);

  // ── KYC update ──────────────────────────────────────────────────────────────
  const handleKyc = (
    userId: string,
    status: "APPROVED" | "REJECTED" | "PENDING" | "NONE"
  ) => {
    setActionError("");
    setPendingId(userId);

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, kycStatus: status } : u))
    );

    startTransition(async () => {
      const res = await updateKycStatus(userId, status);
      setPendingId(null);
      if (res.error) {
        // Roll back
        setUsers(initialUsers);
        setActionError(res.error);
      }
    });
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (userId: string) => {
    setActionError("");
    setPendingId(userId);
    setDeleteConfirm(null);

    // Optimistic remove
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    startTransition(async () => {
      const res = await deleteUser(userId);
      setPendingId(null);
      if (res.error) {
        setUsers(initialUsers);
        setActionError(res.error);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      {/* Table header / filters */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Role filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-200 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* KYC filter */}
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="border border-gray-200 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
            >
              <option value="ALL">All KYC</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NONE">None</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Error banner */}
        {actionError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mt-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {actionError}
            <button onClick={() => setActionError("")} className="ml-auto text-red-400 hover:text-red-700 text-xs font-bold uppercase">dismiss</button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
        </p>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              This will permanently delete the user and all their data (jobs, proposals, messages). This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No users match your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">KYC Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Activity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => {
                const isLoading = pendingId === user.id;
                return (
                  <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${isLoading ? "opacity-60" : ""}`}>
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                            {initials(user.name)}
                          </div>
                          {user.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate max-w-[160px]">{user.name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[user.role]}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* KYC */}
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${KYC_STYLES[user.kycStatus]}`}>
                        {user.kycStatus}
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="text-xs text-gray-500">
                        {user.role === "CLIENT"
                          ? `${user._count.jobs} job${user._count.jobs !== 1 ? "s" : ""} posted`
                          : `${user._count.proposals} proposal${user._count.proposals !== 1 ? "s" : ""}`}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(user.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <>
                            {/* Approve KYC */}
                            {user.kycStatus !== "APPROVED" && user.role !== "ADMIN" && (
                              <button
                                onClick={() => handleKyc(user.id, "APPROVED")}
                                title="Approve KYC"
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors group"
                              >
                                <UserCheck className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                              </button>
                            )}

                            {/* Reject KYC */}
                            {user.kycStatus !== "REJECTED" && user.role !== "ADMIN" && (
                              <button
                                onClick={() => handleKyc(user.id, "REJECTED")}
                                title="Reject KYC"
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                              >
                                <UserX className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                              </button>
                            )}

                            {/* Reset to Pending */}
                            {(user.kycStatus === "APPROVED" || user.kycStatus === "REJECTED") && user.role !== "ADMIN" && (
                              <button
                                onClick={() => handleKyc(user.id, "PENDING")}
                                title="Reset to Pending"
                                className="p-1.5 hover:bg-yellow-50 rounded-lg transition-colors group"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-gray-400 group-hover:text-yellow-600" />
                              </button>
                            )}

                            {/* Delete — never allow deleting ADMIN accounts */}
                            {user.role !== "ADMIN" && (
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                title="Delete user"
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main AdminDashboard component ───────────────────────────────────────────

export default function AdminDashboard({ initialUsers = [], initialJobs = [], initialTransactions = [], stats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("Overview");

  // ── Real stat values with safe fallbacks ────────────────────────────────────
  const totalUsers     = stats?.totalUsers     ?? "—";
  const activeJobs     = stats?.activeJobs     ?? "—";
  const gmv            = stats?.gmv     != null ? `ETB ${stats.gmv.toLocaleString()}`            : "—";
  const escrowPending  = stats?.escrowPending != null ? `ETB ${stats.escrowPending.toLocaleString()}` : "—";
  const disputes       = stats?.openDisputes   ?? "—";
  const pendingKyc     = stats?.pendingKyc     ?? initialUsers.filter((u) => u.kycStatus === "PENDING").length;
  const txPending      = stats?.txPending      ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">EthioFreelance Back Office</p>
        </div>
        {pendingKyc > 0 && (
          <button
            onClick={() => setActiveTab("Users")}
            className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 hover:bg-yellow-100 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 font-medium">
              {pendingKyc} KYC review{pendingKyc !== 1 ? "s" : ""} pending
            </span>
          </button>
        )}
      </div>

      {/* Stats cards — all real DB values */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Users, label: "Total Users", value: totalUsers,
            sub: `${stats?.totalFreelancers ?? "—"} freelancers · ${stats?.totalClients ?? "—"} clients`,
            color: "text-blue-600", bg: "bg-blue-50",
          },
          {
            icon: Briefcase, label: "Active Jobs", value: activeJobs,
            sub: `${stats?.completedJobs ?? "—"} completed · ${stats?.cancelledJobs ?? "—"} cancelled`,
            color: "text-green-600", bg: "bg-green-50",
          },
          {
            icon: DollarSign, label: "Total GMV", value: gmv,
            sub: `${escrowPending} in escrow · ${txPending} pending`,
            color: "text-purple-600", bg: "bg-purple-50",
          },
          {
            icon: AlertTriangle, label: "Open Disputes", value: disputes,
            sub: `${pendingKyc} KYC review${pendingKyc !== 1 ? "s" : ""} pending`,
            color: "text-red-600", bg: "bg-red-50",
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-xs text-gray-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === tab ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {/* Badge for pending KYC on Users tab */}
            {tab === "Users" && pendingKyc > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingKyc}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent registrations */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Recent Registrations</h2>
              <button onClick={() => setActiveTab("Users")} className="text-sm text-green-700 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {initialUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-700 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.role} • {timeAgo(user.createdAt)}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${KYC_STYLES[user.kycStatus]}`}>
                    {user.kycStatus}
                  </span>
                </div>
              ))}
              {initialUsers.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No users yet.</p>
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Recent Jobs</h2>
              <button onClick={() => setActiveTab("Jobs")} className="text-sm text-green-700 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {initialJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{job.title}</div>
                    <div className="text-xs text-gray-400">{job.client.name} • {timeAgo(job.createdAt)}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${JOB_STATUS_STYLES[job.status]}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>
              ))}
              {initialJobs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No jobs posted yet.</p>
              )}
            </div>
          </div>

          {/* Disputes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Active Disputes</h2>
              <button onClick={() => setActiveTab("Disputes")} className="text-sm text-green-700 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {MOCK_DISPUTES.map((d) => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.job}</div>
                      <div className="text-xs text-gray-400">{d.client} vs {d.freelancer}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DISPUTE_STYLES[d.priority]}`}>{d.priority}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DISPUTE_STYLES[d.status]}`}>{d.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-green-700">{d.amount}</span>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-green-100 rounded-lg transition-colors"><CheckCircle className="w-4 h-4 text-green-500" /></button>
                      <button className="p-1 hover:bg-red-100 rounded-lg transition-colors"><XCircle className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform health */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Platform Health</h2>
            <div className="space-y-4">
              {[
                { label: "KYC Verification Rate", value: initialUsers.length > 0 ? Math.round((initialUsers.filter(u => u.kycStatus === "APPROVED").length / initialUsers.length) * 100) : 0, color: "bg-green-500" },
                { label: "Job Completion Rate",   value: 91, color: "bg-blue-500"   },
                { label: "Dispute Resolution",    value: 95, color: "bg-purple-500" },
                { label: "User Satisfaction",     value: 88, color: "bg-yellow-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{value}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-500" />
              <h2 className="font-bold text-gray-900">Fraud Alerts</h2>
            </div>
            <div className="space-y-3">
              {MOCK_FRAUD.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <div className="text-sm font-medium text-red-800">{alert.type}</div>
                    <div className="text-xs text-red-500">{alert.user} • {alert.time}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DISPUTE_STYLES[alert.severity]}`}>{alert.severity}</span>
                    <button className="text-xs text-red-600 hover:underline font-medium">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Users tab — real data ── */}
      {activeTab === "Users" && (
        <UsersTab initialUsers={initialUsers} />
      )}

      {/* ── Jobs tab — real data ── */}
      {activeTab === "Jobs" && (
        <JobsTab initialJobs={initialJobs} />
      )}

      {/* ── Analytics tab ── */}
      {activeTab === "Analytics" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-900">Platform Analytics</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Users",      value: totalUsers.toString()                                          },
              { label: "Active Jobs",      value: activeJobs.toString()                                          },
              { label: "KYC Approved",     value: (stats?.totalUsers && stats?.pendingKyc != null ? (stats.totalUsers - stats.pendingKyc).toString() : initialUsers.filter(u => u.kycStatus === "APPROVED").length.toString()) },
              { label: "Total GMV",        value: gmv                                                            },
            ].map(({ label, value }) => (
              <div key={label} className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-900 mb-1">{value}</div>
                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" /> {label}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Charts will render here with a charting library (e.g. Recharts)</p>
          </div>
        </div>
      )}

      {/* ── Payments tab — real data ── */}
      {activeTab === "Payments" && (
        <PaymentsTab initialTransactions={initialTransactions} />
      )}

      {/* ── Placeholder tabs ── */}
      {activeTab === "Disputes" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Disputes Management</h2>
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">⚖️</div>
            <p className="font-medium text-gray-600">Disputes management panel</p>
            <p className="text-sm mt-1">Coming in the next implementation phase.</p>
          </div>
        </div>
      )}
    </div>
  );
}
