"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, CheckCircle, ArrowRight,
  DollarSign, Clock, AlertCircle, Loader2, Rocket,
} from "lucide-react";
import { createJob } from "@/app/actions/job";

const categories = [
  "IT & Software", "Design & Creative", "Writing & Content", "Translation",
  "Data Entry", "Tutoring", "Finance & Accounting", "NGO & Remote Work",
  "Local Services", "Photography & Video", "Government Tasks", "Other",
];

const skillSuggestions = [
  "React", "Node.js", "Python", "Figma", "Amharic", "Excel",
  "WordPress", "Flutter", "Kotlin", "SQL",
];

interface Milestone {
  title: string;
  amount: string;
  due: string;
}

interface FormState {
  title: string;
  category: string;
  description: string;
  location: string;
  budget: string;
  minBudget: string;
  maxBudget: string;
  hourlyRate: string;
  deadline: string;
  language: string;
}

export default function PostJobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [jobType, setJobType] = useState<"fixed" | "hourly">("fixed");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", amount: "", due: "" },
  ]);
  const [form, setForm] = useState<FormState>({
    title: "",
    category: "",
    description: "",
    location: "Remote",
    budget: "",
    minBudget: "",
    maxBudget: "",
    hourlyRate: "",
    deadline: "",
    language: "Both",
  });

  // Error state per step so users see inline feedback
  const [step1Error, setStep1Error] = useState("");
  const [step2Error, setStep2Error] = useState("");
  const [submitError, setSubmitError] = useState("");

  const update = (field: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  // ── Skills helpers ──────────────────────────────────────────────────────────
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) =>
    setSkills((prev) => prev.filter((s) => s !== skill));

  // ── Milestone helpers ───────────────────────────────────────────────────────
  const addMilestone = () =>
    setMilestones((prev) => [...prev, { title: "", amount: "", due: "" }]);

  const removeMilestone = (i: number) =>
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, field: keyof Milestone, value: string) => {
    setMilestones((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  // ── Step 1 validation ───────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (!form.title.trim()) {
      setStep1Error("Job title is required.");
      return false;
    }
    if (form.title.trim().length < 10) {
      setStep1Error("Job title must be at least 10 characters.");
      return false;
    }
    if (!form.category) {
      setStep1Error("Please select a category.");
      return false;
    }
    if (!form.description.trim()) {
      setStep1Error("Job description is required.");
      return false;
    }
    if (form.description.trim().length < 50) {
      setStep1Error("Description must be at least 50 characters.");
      return false;
    }
    setStep1Error("");
    return true;
  };

  // ── Step 2 validation ───────────────────────────────────────────────────────
  const validateStep2 = (): boolean => {
    if (jobType === "fixed") {
      const min = parseFloat(form.minBudget);
      const max = parseFloat(form.maxBudget);
      if (!form.minBudget || isNaN(min) || min <= 0) {
        setStep2Error("Please enter a valid minimum budget.");
        return false;
      }
      if (!form.maxBudget || isNaN(max) || max <= 0) {
        setStep2Error("Please enter a valid maximum budget.");
        return false;
      }
      if (max < min) {
        setStep2Error("Maximum budget cannot be less than minimum budget.");
        return false;
      }
    } else {
      const rate = parseFloat(form.hourlyRate);
      if (!form.hourlyRate || isNaN(rate) || rate <= 0) {
        setStep2Error("Please enter a valid hourly rate.");
        return false;
      }
    }
    setStep2Error("");
    return true;
  };

  const handleStep1Continue = () => {
    if (validateStep1()) setStep(2);
  };

  const handleStep2Continue = () => {
    if (validateStep2()) setStep(3);
  };

  // ── Final submit ────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    setSubmitError("");

    // Derive the single budget value the action expects:
    // For fixed: use the midpoint of min/max range
    // For hourly: use the hourly rate directly
    const budgetValue =
      jobType === "fixed"
        ? (parseFloat(form.minBudget) + parseFloat(form.maxBudget)) / 2
        : parseFloat(form.hourlyRate);

    startTransition(async () => {
      const result = await createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        budget: budgetValue,
        type: jobType === "fixed" ? "FIXED" : "HOURLY",
        location: form.location,
        category: form.category,
        skills,
        // Only pass milestones that have at least a title filled in
        milestones: jobType === "fixed"
          ? milestones
              .filter(m => m.title.trim())
              .map((m, i) => ({
                title:   m.title.trim(),
                amount:  parseFloat(m.amount) || 0,
                dueDate: m.due || undefined,
                order:   i,
              }))
          : [],
      });

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      // Success — navigate to the new job or dashboard
      if (result.jobId) {
        router.push(`/jobs/${result.jobId}?posted=true`);
      } else {
        router.push("/dashboard");
      }
    });
  };

  // ── Derived display values for review step ──────────────────────────────────
  const budgetDisplay =
    jobType === "fixed"
      ? `ETB ${Number(form.minBudget || 0).toLocaleString()} – ${Number(form.maxBudget || 0).toLocaleString()}`
      : `ETB ${Number(form.hourlyRate || 0).toLocaleString()}/hr`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">Post a Job</h1>
        <p className="text-gray-500">Find the perfect Ethiopian freelancer for your project</p>
      </div>

      {/* ── Progress indicator ── */}
      <div className="flex items-center gap-2 mb-8">
        {["Job Details", "Budget & Timeline", "Review & Post"].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > i + 1
                    ? "bg-green-500 text-white"
                    : step === i + 1
                    ? "bg-green-700 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  step === i + 1 ? "text-green-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`flex-1 h-1 rounded-full ${
                  step > i + 1 ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">

        {/* ════════════════════════════════════════════════════════════
            STEP 1 — Job Details
        ════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Job Details</h2>

            {/* Inline error banner */}
            {step1Error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {step1Error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Full Stack Developer for E-commerce Website"
                maxLength={120}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/120</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={6}
                maxLength={2000}
                placeholder="Describe your project in detail. Include requirements, deliverables, and any specific skills needed..."
                className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Required Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="px-4 py-2.5 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800 transition-colors"
                >
                  Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <Trash2 className="w-3 h-3 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {skillSuggestions
                  .filter((s) => !skills.includes(s))
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location</label>
                <select
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option>Remote</option>
                  <option>Addis Ababa</option>
                  <option>Dire Dawa</option>
                  <option>Mekelle</option>
                  <option>Hawassa</option>
                  <option>Bahir Dar</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Preferred Language
                </label>
                <select
                  value={form.language}
                  onChange={(e) => update("language", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="Both">Amharic or English</option>
                  <option value="Amharic">Amharic Only</option>
                  <option value="English">English Only</option>
                  <option value="Oromo">Afaan Oromo</option>
                  <option value="Tigrinya">Tigrinya</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStep1Continue}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 2 — Budget & Timeline
        ════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Budget & Timeline</h2>

            {step2Error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {step2Error}
              </div>
            )}

            {/* Payment type toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJobType("fixed")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    jobType === "fixed"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <DollarSign
                    className={`w-5 h-5 mb-2 ${
                      jobType === "fixed" ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <div className="font-semibold text-sm text-gray-900">Fixed Price</div>
                  <div className="text-xs text-gray-500">Pay a set amount for the whole project</div>
                </button>
                <button
                  type="button"
                  onClick={() => setJobType("hourly")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    jobType === "hourly"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Clock
                    className={`w-5 h-5 mb-2 ${
                      jobType === "hourly" ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <div className="font-semibold text-sm text-gray-900">Hourly Rate</div>
                  <div className="text-xs text-gray-500">Pay by the hour for ongoing work</div>
                </button>
              </div>
            </div>

            {/* Budget inputs — now fully controlled */}
            {jobType === "fixed" ? (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Budget Range (ETB) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ETB</span>
                    <input
                      type="number"
                      min="0"
                      value={form.minBudget}
                      onChange={(e) => update("minBudget", e.target.value)}
                      placeholder="Min budget"
                      className="w-full border border-gray-200 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ETB</span>
                    <input
                      type="number"
                      min="0"
                      value={form.maxBudget}
                      onChange={(e) => update("maxBudget", e.target.value)}
                      placeholder="Max budget"
                      className="w-full border border-gray-200 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Hourly Rate (ETB/hr) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ETB</span>
                  <input
                    type="number"
                    min="0"
                    value={form.hourlyRate}
                    onChange={(e) => update("hourlyRate", e.target.value)}
                    placeholder="e.g. 300"
                    className="w-full border border-gray-200 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Project Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => update("deadline", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Milestones — fixed price only */}
            {jobType === "fixed" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Payment Milestones <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <input
                        placeholder="Milestone title"
                        value={m.title}
                        onChange={(e) => updateMilestone(i, "title", e.target.value)}
                        className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <input
                        placeholder="Amount (ETB)"
                        type="number"
                        min="0"
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                        className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <div className="flex gap-2">
                        <input
                          placeholder="Due date"
                          type="date"
                          value={m.due}
                          onChange={(e) => updateMilestone(i, "due", e.target.value)}
                          className="flex-1 border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(i)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove milestone"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStep2Continue}
                className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Review Job <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 3 — Review & Post
        ════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Review & Post</h2>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            {/* Summary card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
              {[
                { label: "Job Title", value: form.title || "Not set" },
                { label: "Category", value: form.category || "Not set" },
                { label: "Payment Type", value: jobType === "fixed" ? "Fixed Price" : "Hourly Rate" },
                { label: "Budget", value: budgetDisplay },
                { label: "Location", value: form.location },
                { label: "Language", value: form.language },
                {
                  label: "Skills",
                  value: skills.length > 0 ? skills.join(", ") : "None added",
                },
                {
                  label: "Deadline",
                  value: form.deadline
                    ? new Date(form.deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set",
                },
                { label: "Platform Fee", value: "1% of project value" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span
                    className={`font-medium text-right max-w-xs ${
                      label === "Platform Fee" ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>💡 Tip:</strong> Jobs with detailed descriptions and clear milestones receive 3× more quality proposals.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isPending}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
