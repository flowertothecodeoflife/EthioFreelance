"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2, Loader2, User } from "lucide-react";
import { updateAvatarAction, removeAvatarAction } from "@/app/actions/avatar";
import Image from "next/image";

interface Props {
  currentUrl: string | null;
  name: string;
}

// Derive consistent gradient from name (same logic used elsewhere)
const COLORS = [
  "from-blue-500 to-indigo-600",   "from-purple-500 to-pink-600",
  "from-green-600 to-emerald-700", "from-orange-500 to-amber-600",
  "from-teal-500 to-cyan-600",     "from-pink-500 to-rose-600",
];
function gradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function AvatarUpload({ currentUrl, name }: Props) {
  const [preview,  setPreview]  = useState<string | null>(currentUrl);
  const [error,    setError]    = useState<string | null>(null);
  const [isPending, start]      = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    // Client-side preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    const fd = new FormData();
    fd.append("avatar", file);
    start(async () => {
      const res = await updateAvatarAction(fd);
      if (res.error) {
        setError(res.error);
        setPreview(currentUrl); // roll back preview
      } else if (res.avatarUrl) {
        setPreview(res.avatarUrl);
      }
    });
  };

  const handleRemove = () => {
    setError(null);
    start(async () => {
      const res = await removeAvatarAction();
      if (res.error) { setError(res.error); return; }
      setPreview(null);
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      {/* Avatar display */}
      <div className="relative group">
        {preview ? (
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-green-200 shadow-md">
            <Image
              src={preview}
              alt={name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized // public Supabase URL, no need for Next.js image optimization
            />
          </div>
        ) : (
          <div className={`w-24 h-24 bg-gradient-to-br ${gradient(name)} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md`}>
            {initials(name)}
          </div>
        )}

        {/* Upload overlay on hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Change photo"
        >
          {isPending ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          {preview ? "Change photo" : "Upload photo"}
        </button>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // reset so same file can be re-selected
        }}
      />

      <p className="text-[10px] text-gray-400">JPEG, PNG or WebP · max 2 MB</p>
    </div>
  );
}
