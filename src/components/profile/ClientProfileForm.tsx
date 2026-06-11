"use client";
import { useState, useTransition } from "react";
import { updateClientProfile } from "@/app/actions/profile";
import { User, Phone, CheckCircle, AlertCircle, Building2 } from "lucide-react";

interface ClientProfileFormProps {
  initialData: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function ClientProfileForm({ initialData }: ClientProfileFormProps) {
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone);

  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const res = await updateClientProfile({ name, phone });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Profile updated successfully!");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-500 text-xs">Update your name and contact details.</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            Full Name / Company Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abebe Girma or TechEthio PLC"
              required
              className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            Email Address <span className="text-gray-400 font-normal normal-case">(cannot be changed)</span>
          </label>
          <input
            type="email"
            value={initialData.email}
            disabled
            className="w-full bg-gray-100 border border-gray-200 text-gray-400 px-4 py-3.5 rounded-2xl text-sm cursor-not-allowed font-medium"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
            Phone Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 9XX XXX XXX"
              className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
