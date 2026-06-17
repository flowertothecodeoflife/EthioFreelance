"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Clock, DollarSign, Users, Star, CheckCircle,
  Bookmark, Share2, Flag, ChevronRight, Send, Loader2,
  AlertCircle, PartyPopper, LogIn, ShieldAlert, Calendar,
  User, FileText, ThumbsUp, ThumbsDown, Bookmark as BookmarkIcon,
  BadgeCheck, XCircle, Wallet, X, Paperclip, Trash2,
  RotateCcw,
} from "lucide-react";
import { submitProposal, updateProposalStatus, withdrawProposal } from "@/app/actions/proposal";
import PaymentSelector from "@/components/payment/PaymentSelector";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FreelancerProfile {
  title: string | null; bio: string | null; skills: string[];
  hourlyRate: number | null; rating: number; completedJobs: number;
}
interface ProposalFreelancer { id: string; name: string; profile: FreelancerProfile | null; }
interface ProposalAttachment  { id: string; url: string; name: string; size: number; }

export interface JobProposal {
  id: string; bidAmount: number; coverLetter: string;
  status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  withdrawnAt?: string | Date | null;
  createdAt: string | Date;
  freelancer: ProposalFreelancer;
  attachments: ProposalAttachment[];
}

export interface JobMilestone {
  id: string; title: string; amount: number;
  dueDate?: string | null; order: number;
}

export interface JobData {
  id: string; title: string; description: string;
  budget: number; type: "FIXED" | "HOURLY";
  location: string; category: string; skills: string[];
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string | Date;
  escrowFunded?: boolean;
  milestones: JobMilestone[];
  client: { id: string; name: string; email: string; createdAt: string | Date; kycStatus: string; };
  proposals: JobProposal[];
}

interface JobDetailProps {
  job: JobData;
  currentUserId?: string;
  currentUserRole?: string;
}

// ─── State machines ───────────────────────────────────────────────────────────

type SubmitState =
  | { status: "idle" } | { status: "submitting" }
  | { status: "success"; proposalId: string }
  | { status: "error"; message: string } | { status: "duplicate" };

// ─── Style maps ───────────────────────────────────────────────────────────────

const PROPOSAL_BADGE: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600", SHORTLISTED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-600",
};
const JOB_STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700", IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-teal-100 text-teal-700", CANCELLED: "bg-red-100 text-red-600",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(budget: number, type: "FIXED" | "HOURLY") {
  return type === "HOURLY" ? `ETB ${budget.toLocaleString()}/hr` : `ETB ${budget.toLocaleString()}`;
}
function timeAgo(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Cloudinary unsigned upload helper ────────────────────────────────────────
// Uses the unsigned preset so no server round-trip is needed for the upload itself.
// Falls back to a mock URL in dev if NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME isn't set.

async function uploadToCloudinary(file: File): Promise<{ url: string; name: string; size: number }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset    = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ethiofreelance_proposals";

  if (!cloudName) {
    // Dev fallback — return a fake URL so the rest of the flow works without Cloudinary configured
    console.warn("[Dev] Cloudinary not configured. Using placeholder URL.");
    return { url: `https://placeholder.com/${encodeURIComponent(file.name)}`, name: file.name, size: file.size };
  }

  const fd = new FormData();
  fd.append("file",         file);
  fd.append("upload_preset", preset);
  fd.append("folder",       "proposal_attachments");

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: fd });
  const json = await res.json();
  if (!json.secure_url) throw new Error("Cloudinary upload failed");
  return { url: json.secure_url, name: file.name, size: file.size };
}

// ─── ProposalsPanel — owner view ─────────────────────────────────────────────

function ProposalsPanel({ jobId, initialProposals, jobStatus }: {
  jobId: string; initialProposals: JobProposal[]; jobStatus: string;
}) {
  const [proposals, setProposals] = useState<JobProposal[]>(initialProposals);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [err, setErr]             = useState("");
  const [, startTransition]       = useTransition();

  const handle = (proposalId: string, newStatus: "ACCEPTED"|"REJECTED"|"SHORTLISTED"|"PENDING") => {
    setErr(""); setPendingId(proposalId);
    setProposals(p => p.map(x => x.id === proposalId ? { ...x, status: newStatus } : x));
    startTransition(async () => {
      const r = await updateProposalStatus(proposalId, newStatus);
      setPendingId(null);
      if (r.error) { setProposals(initialProposals); setErr(r.error); }
    });
  };

  if (proposals.length === 0) return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-green-600" /> Proposals
        <span className="text-gray-400 font-normal text-sm">(0)</span>
      </h2>
      <div className="text-center py-8 text-gray-400">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No proposals yet. Freelancers will appear here once they apply.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <FileText className="w-5 h-5 text-green-600" /> Proposals
        <span className="ml-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{proposals.length}</span>
      </h2>
      <p className="text-xs text-gray-400 mb-5">Review bids. Accepting a proposal marks the job as In Progress.</p>

      {err && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{err}
          <button onClick={() => setErr("")} className="ml-auto text-red-400 text-xs font-bold uppercase">dismiss</button>
        </div>
      )}

      <div className="space-y-4">
        {proposals.map(p => {
          const loading    = pendingId === p.id;
          const accepted   = p.status === "ACCEPTED";
          const rejected   = p.status === "REJECTED";
          const withdrawn  = !!p.withdrawnAt;
          const jobClosed  = jobStatus !== "OPEN";

          return (
            <div key={p.id} className={`border rounded-2xl p-5 transition-all ${
              accepted ? "border-green-300 bg-green-50/40" :
              rejected || withdrawn ? "border-gray-100 bg-gray-50/50 opacity-60" :
              "border-gray-100 hover:border-green-200"
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {p.freelancer.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      {p.freelancer.name}
                      {p.freelancer.profile && p.freelancer.profile.completedJobs > 0 && (
                        <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.freelancer.profile?.title || "Freelancer"}
                      {p.freelancer.profile && p.freelancer.profile.rating > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {p.freelancer.profile.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-base font-bold text-green-700">ETB {p.bidAmount.toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PROPOSAL_BADGE[p.status]}`}>
                    {withdrawn ? "WITHDRAWN" : p.status}
                  </span>
                </div>
              </div>

              {p.freelancer.profile?.skills && p.freelancer.profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.freelancer.profile.skills.slice(0, 5).map(s => (
                    <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">{p.coverLetter}</p>

              {/* Attachments */}
              {p.attachments && p.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.attachments.map(a => (
                    <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                      <Paperclip className="w-3 h-3" />{a.name}
                      <span className="text-blue-400">({fmtBytes(a.size)})</span>
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{timeAgo(p.createdAt)}
                </span>
                {!jobClosed && !rejected && !withdrawn && (
                  <div className="flex gap-2">
                    {p.status !== "SHORTLISTED" && !accepted && (
                      <button type="button" disabled={loading}
                        onClick={() => handle(p.id, "SHORTLISTED")}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookmarkIcon className="w-3 h-3" />} Shortlist
                      </button>
                    )}
                    {!accepted && (
                      <button type="button" disabled={loading}
                        onClick={() => handle(p.id, "ACCEPTED")}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} Accept
                      </button>
                    )}
                    {!accepted && (
                      <button type="button" disabled={loading}
                        onClick={() => handle(p.id, "REJECTED")}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3" />} Reject
                      </button>
                    )}
                    {accepted && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3 h-3" /> Accepted
                      </span>
                    )}
                  </div>
                )}
                {jobClosed && <span className="text-xs text-gray-400 italic">Job closed</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JobDetail({ job, currentUserId, currentUserRole }: JobDetailProps) {
  const t = useTranslations("jobDetail");
  const isOwner        = !!currentUserId && currentUserId === job.client.id;
  const isFreelancer   = currentUserRole === "FREELANCER";
  const isAuthenticated = !!currentUserId;
  const isJobOpen       = job.status === "OPEN";

  const [isPending, startTransition] = useTransition();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "done">("idle");

  // Proposal form fields
  const [bidAmount,   setBidAmount]   = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [bidError,    setBidError]    = useState("");
  const [coverError,  setCoverError]  = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  // File attachments state
  const fileInputRef                     = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError]    = useState("");

  // Withdraw state — track the freelancer's own proposal
  const myProposal = isFreelancer && currentUserId
    ? job.proposals.find(p => p.freelancer.id === currentUserId)
    : undefined;
  const [withdrawState, setWithdrawState] = useState<"idle"|"confirming"|"pending"|"done"|"error">("idle");
  const [withdrawError, setWithdrawError] = useState("");

  const budgetDisplay = formatBudget(job.budget, job.type);
  const postedAgo     = timeAgo(job.createdAt);
  const clientInitials = job.client.name.slice(0, 2).toUpperCase();

  // ── File attach handler ─────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB per file
    const oversized = files.filter(f => f.size > MAX_SIZE);
    if (oversized.length > 0) {
      setUploadError(`File too large: ${oversized.map(f => f.name).join(", ")} (max 10 MB each)`);
      return;
    }
    setUploadError("");
    setAttachedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...files.filter(f => !existing.has(f.name))].slice(0, 5); // max 5 files
    });
    e.target.value = ""; // reset so the same file can be re-added after removal
  };

  const removeFile = (name: string) =>
    setAttachedFiles(prev => prev.filter(f => f.name !== name));

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    let ok = true;
    if (!bidAmount || isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0) {
      setBidError("Please enter a valid bid amount greater than 0."); ok = false;
    } else setBidError("");
    if (!coverLetter.trim()) {
      setCoverError("Cover letter is required."); ok = false;
    } else if (coverLetter.trim().length < 50) {
      setCoverError("Cover letter must be at least 50 characters."); ok = false;
    } else setCoverError("");
    return ok;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitState({ status: "submitting" });
    startTransition(async () => {
      let uploads: { url: string; name: string; size: number }[] = [];
      if (attachedFiles.length > 0) {
        setUploadingFiles(true);
        try {
          uploads = await Promise.all(attachedFiles.map(uploadToCloudinary));
        } catch {
          setUploadError("File upload failed. Please try again.");
          setSubmitState({ status: "idle" });
          setUploadingFiles(false);
          return;
        }
        setUploadingFiles(false);
      }
      const r = await submitProposal({
        jobId: job.id, bidAmount: parseFloat(bidAmount),
        coverLetter: coverLetter.trim(), attachments: uploads,
      });
      if (r.error) {
        if (r.error.toLowerCase().includes("already submitted"))
          setSubmitState({ status: "duplicate" });
        else setSubmitState({ status: "error", message: r.error });
        return;
      }
      setSubmitState({ status: "success", proposalId: r.proposalId! });
      setBidAmount(""); setCoverLetter(""); setAttachedFiles([]);
    });
  };

  // ── Withdraw ────────────────────────────────────────────────────────────────
  const handleWithdraw = () => {
    if (!myProposal) return;
    setWithdrawState("pending"); setWithdrawError("");
    startTransition(async () => {
      const r = await withdrawProposal(myProposal.id);
      if (r.error) { setWithdrawState("error"); setWithdrawError(r.error); }
      else setWithdrawState("done");
    });
  };

  const sidebarBtnDisabled =
    submitState.status === "success" || submitState.status === "duplicate" || !isJobOpen;
  const sidebarBtnLabel =
    submitState.status === "success"   ? "Proposal Sent ✓" :
    submitState.status === "duplicate" ? "Already Applied" :
    !isJobOpen ? "Job Closed" :
    showProposalForm ? "Hide Form" : "Submit Proposal";

  // ── Proposal section renderer ───────────────────────────────────────────────
  const renderProposalSection = () => {
    if (!isAuthenticated) return (
      <div className="bg-white rounded-2xl p-6 border border-green-200">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center"><LogIn className="w-6 h-6 text-green-700" /></div>
          <h3 className="font-bold text-gray-900">{t("applyPanel.title")}</h3>
          <div className="flex gap-3 mt-1">
            <Link href={`/login?callbackUrl=/jobs/${job.id}`} className="bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-green-800">Sign In</Link>
            <Link href="/register?role=freelancer" className="border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">Register</Link>
          </div>
        </div>
      </div>
    );

    if (isOwner) return null;

    if (currentUserRole === "CLIENT" || currentUserRole === "ADMIN") return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-start gap-3 text-sm text-gray-500">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>Only <strong>freelancer</strong> accounts can submit proposals.{" "}
            {currentUserRole === "CLIENT" && <><Link href="/register?role=freelancer" className="text-green-700 font-semibold hover:underline">Create a freelancer account</Link> to bid.</>}
          </p>
        </div>
      </div>
    );

    if (!isJobOpen) return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p>This job is <strong>{job.status.replace("_", " ").toLowerCase()}</strong> and is no longer accepting proposals.</p>
        </div>
      </div>
    );

    // Withdraw section — freelancer already applied
    if (myProposal) {
      if (withdrawState === "done" || myProposal.withdrawnAt) return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Proposal Withdrawn</p>
              <p className="text-amber-700 text-xs mt-0.5">Your proposal has been withdrawn. The client has been notified.</p>
            </div>
          </div>
        </div>
      );
      return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Your Proposal</p>
              <p className="text-xs text-gray-500 mt-0.5">Bid: <strong>ETB {myProposal.bidAmount.toLocaleString()}</strong> · {timeAgo(myProposal.createdAt)}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PROPOSAL_BADGE[myProposal.status]}`}>{myProposal.status}</span>
          </div>
          {myProposal.status === "PENDING" && (
            <>
              {withdrawState === "confirming" ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-700 font-medium mb-2">Are you sure you want to withdraw?</p>
                  {withdrawError && <p className="text-xs text-red-600 mb-2">{withdrawError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setWithdrawState("idle")} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={handleWithdraw} disabled={(withdrawState as string) === "pending"}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-1">
                      {(withdrawState as string) === "pending" ? <><Loader2 className="w-3 h-3 animate-spin" />Withdrawing...</> : "Yes, Withdraw"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setWithdrawState("confirming")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-2 rounded-lg transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Withdraw Proposal
                </button>
              )}
            </>
          )}
          <Link href="/dashboard" className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1">
            Track in Dashboard <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      );
    }

    if (submitState.status === "duplicate") return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Already Applied</p>
            <p className="text-amber-700 text-sm mt-1">Check your <Link href="/dashboard" className="font-semibold underline">dashboard</Link> to track its status or withdraw.</p>
          </div>
        </div>
      </div>
    );

    if (submitState.status === "success") return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <PartyPopper className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-800 text-sm">Proposal Submitted!</p>
            <p className="text-green-700 text-sm mt-1">You'll be notified when the client responds.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-green-700 hover:underline">
              Track in Dashboard <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );

    if (!showProposalForm) return null;

    return (
      <div className="bg-white rounded-2xl p-6 border border-green-200" id="proposal-form-anchor">
        <h2 className="font-bold text-gray-900 mb-4">Submit Your Proposal</h2>
        {submitState.status === "error" && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{(submitState as any).message}
          </div>
        )}
        <div className="space-y-4">
          {/* Bid */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Bid Amount (ETB) <span className="text-red-500">*</span></label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="number" min="1" value={bidAmount} disabled={isPending || uploadingFiles}
                onChange={e => { setBidAmount(e.target.value); if (bidError) setBidError(""); setSubmitState({ status: "idle" }); }}
                placeholder="e.g. 18000"
                className={`w-full border pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60 ${bidError ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
            </div>
            {bidError && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{bidError}</p>}
          </div>
          {/* Cover letter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cover Letter <span className="text-red-500">*</span></label>
            <textarea value={coverLetter} rows={6} maxLength={2000} disabled={isPending || uploadingFiles}
              onChange={e => { setCoverLetter(e.target.value); if (coverError) setCoverError(""); setSubmitState({ status: "idle" }); }}
              placeholder="Describe your experience, approach, and why you're the best fit..."
              className={`w-full border px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none disabled:opacity-60 ${coverError ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
            <div className="flex justify-between mt-1">
              {coverError ? <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{coverError}</p> : <span />}
              <p className="text-xs text-gray-400 ml-auto">{coverLetter.length}/2000</p>
            </div>
          </div>
          {/* File attachments */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Attachments <span className="text-gray-400 font-normal">(optional, max 5 files, 10 MB each)</span></label>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" onChange={handleFilePick} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={attachedFiles.length >= 5 || isPending}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Paperclip className="w-4 h-4" /> Attach Files
            </button>
            {uploadError && <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{uploadError}</p>}
            {attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachedFiles.map(f => (
                  <div key={f.name} className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                    <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate text-gray-700">{f.name}</span>
                    <span className="text-gray-400 flex-shrink-0">{fmtBytes(f.size)}</span>
                    <button type="button" onClick={() => removeFile(f.name)} className="p-0.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Submit */}
          <button type="button" onClick={handleSubmit} disabled={isPending || uploadingFiles}
            className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed">
            {uploadingFiles ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading files...</> :
             isPending     ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> :
                             <><Send className="w-4 h-4" />Submit Proposal</>}
          </button>
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/jobs" className="hover:text-green-700">Jobs</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-600 truncate max-w-xs">{job.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Job header */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{job.category}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${JOB_STATUS_STYLES[job.status]}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Posted {postedAgo}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{job.proposals.length} proposals</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button aria-label="Bookmark" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bookmark className="w-5 h-5 text-gray-400" />
                </button>
                <button aria-label="Share" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(s => (
                <span key={s} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">{s}</span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Job Description</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{job.description}</div>
          </div>

          {/* Milestones — real DB data, only shown when milestones exist */}
          {job.milestones && job.milestones.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Payment Milestones</h2>
              <div className="space-y-3">
                {job.milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{m.title}</div>
                        {m.dueDate && (
                          <div className="text-xs text-gray-500">
                            Due: {new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-green-700 flex-shrink-0">
                      ETB {m.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposals panel — owner only */}
          {isOwner && (
            <ProposalsPanel jobId={job.id} initialProposals={job.proposals} jobStatus={job.status} />
          )}

          {/* Proposal form / status — freelancers */}
          {renderProposalSection()}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-green-700 mb-1">{budgetDisplay}</div>
              <div className="text-sm text-gray-500">{job.type === "FIXED" ? "Fixed Price" : "Hourly Rate"}</div>
            </div>

            {/* Freelancer — Submit Proposal button */}
            {isFreelancer && !myProposal && (
              <button type="button" disabled={sidebarBtnDisabled}
                onClick={() => {
                  if (sidebarBtnDisabled) return;
                  setShowProposalForm(p => !p);
                  if (!showProposalForm) setTimeout(() =>
                    document.getElementById("proposal-form-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                }}
                className={`w-full font-bold py-3 rounded-xl transition-colors mb-3 text-sm ${
                  submitState.status === "success"   ? "bg-green-100 text-green-700 cursor-default" :
                  submitState.status === "duplicate" ? "bg-amber-100 text-amber-700 cursor-default" :
                  !isJobOpen ? "bg-gray-100 text-gray-400 cursor-default" :
                  "bg-green-700 text-white hover:bg-green-800"
                }`}>
                {sidebarBtnLabel}
              </button>
            )}

            {/* Freelancer already applied — show proposal status in sidebar */}
            {isFreelancer && myProposal && !myProposal.withdrawnAt && (
              <div className={`w-full text-center font-semibold py-2.5 rounded-xl mb-3 text-sm ${PROPOSAL_BADGE[myProposal.status]}`}>
                Proposal: {myProposal.status}
              </div>
            )}

            {/* Fund Escrow — owner, IN_PROGRESS, unfunded */}
            {isOwner && job.status === "IN_PROGRESS" && !job.escrowFunded && (
              <button type="button" onClick={() => setShowPaymentModal(true)}
                className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors mb-3 text-sm flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" /> {t("ownerPanel.fundEscrow")}
              </button>
            )}

            {/* Escrow funded badge */}
            {isOwner && job.status === "IN_PROGRESS" && job.escrowFunded && (
              <div className="w-full bg-green-50 border border-green-200 text-green-700 font-semibold py-3 rounded-xl mb-3 text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Escrow Funded
              </div>
            )}

            {!isAuthenticated && (
              <Link href={`/login?callbackUrl=/jobs/${job.id}`}
                className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors mb-3 text-sm flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" /> {t("applyPanel.loginPrompt")}
              </Link>
            )}

            <Link href="/messages"
              className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center">
              Message Client
            </Link>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-500">
              {[
                ["Type",         job.type === "FIXED" ? "Fixed Price" : "Hourly"],
                ["Proposals",    String(job.proposals.length)],
                ["Milestones",   job.milestones.length > 0 ? String(job.milestones.length) : "None"],
                ["Posted",       postedAgo],
                ["Platform Fee", "1% only"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className={`font-medium ${k === "Platform Fee" ? "text-green-600" : "text-gray-700"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Client card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">{t("aboutClient")}</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-base">
                {clientInitials}
              </div>
              <div>
                <div className="font-medium text-gray-900">{job.client.name}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Member since {new Date(job.client.createdAt).getFullYear()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {job.client.kycStatus === "APPROVED" ? (
                <span className="flex items-center gap-1.5 text-green-600"><CheckCircle className="w-4 h-4" /> Identity Verified</span>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-400"><User className="w-4 h-4" /> Unverified</span>
              )}
            </div>
          </div>

          {reportState === "done" ? (
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" /> Report submitted — thank you.
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setReportState("done");
                setTimeout(() => setReportState("idle"), 5000);
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <Flag className="w-4 h-4" /> Report this job
            </button>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <button type="button" onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="p-6">
              <PaymentSelector jobId={job.id} jobTitle={job.title} amount={job.budget}
                onSuccess={() => { setShowPaymentModal(false); window.location.reload(); }}
                onCancel={() => setShowPaymentModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
