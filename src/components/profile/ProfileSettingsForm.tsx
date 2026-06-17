"use client";
import { useState, useTransition } from "react";
import { updateFreelancerProfile } from "@/app/actions/profile";
import { Briefcase, DollarSign, BookOpen, Tag, Plus, X, Award, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileSettingsFormProps {
  initialData: {
    title: string;
    bio: string;
    skills: string[];
    hourlyRate: number;
  };
}

export default function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const t = useTranslations("profile");
  const [title, setTitle] = useState(initialData.title);
  const [bio, setBio] = useState(initialData.bio);
  const [hourlyRate, setHourlyRate] = useState(initialData.hourlyRate.toString());
  const [skills, setSkills] = useState<string[]>(initialData.skills);
  const [newSkill, setNewSkill] = useState("");

  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const parsedRate = parseFloat(hourlyRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      setError("Please enter a valid, non-negative hourly rate.");
      return;
    }

    startTransition(async () => {
      const res = await updateFreelancerProfile({
        title,
        bio,
        skills,
        hourlyRate: parsedRate,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Profile settings updated successfully!");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
          <Award className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("pageTitle")}</h2>
          <p className="text-gray-500 text-xs">{t("pageSub")}</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="font-semibold">{success || t("successMessage")}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Professional Title */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            {t("titleLabel")}
          </label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              required
              className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            {t("hourlyRateLabel")}
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder={t("hourlyRatePlaceholder")}
              required
              min="0"
              className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            {t("bioLabel")}
          </label>
          <div className="relative">
            <BookOpen className="absolute left-4 top-5 w-5 h-5 text-gray-400" />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPlaceholder")}
              required
              rows={6}
              className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            {t("skillsLabel")}
          </label>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder={t("skillsPlaceholder")}
                className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSkill}
              className="bg-green-700 hover:bg-green-800 text-white font-bold px-5 rounded-2xl transition-all flex items-center justify-center shadow-md cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            {skills.length === 0 ? (
              <span className="text-xs text-gray-400 self-center">No skills added yet. Add skills to stand out.</span>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="w-4 h-4 bg-green-200 hover:bg-green-300 text-green-800 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "Save Profile Changes"
          )}
        </button>
      </form>
    </div>
  );
}
