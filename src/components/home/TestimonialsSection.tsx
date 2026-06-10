"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIALS = [
  { name: "Selam Tesfaye",  role: "Client — E-commerce Owner",     location: "Addis Ababa", avatar: "ST", gradient: "from-purple-500 to-pink-600",   rating: 5, text: "I found an amazing web developer within 24 hours. The Chapa payment system made everything so easy. I paid in ETB and the work was delivered on time. EthioFreelance is a game changer!" },
  { name: "Biruk Mengistu", role: "Freelancer — Graphic Designer",  location: "Bahir Dar",   avatar: "BM", gradient: "from-blue-500 to-indigo-600",    rating: 5, text: "Before EthioFreelance, I had no way to find clients outside my city. Now I work with companies in Addis Ababa and even NGOs. My income has tripled in 6 months!" },
  { name: "Almaz Bekele",   role: "Client — NGO Project Manager",   location: "Hawassa",     avatar: "AB", gradient: "from-teal-500 to-cyan-600",      rating: 5, text: "We needed Amharic translators urgently for a survey project. Found 3 verified translators in one day. The built-in chat made coordination seamless. Highly recommended!" },
  { name: "Henok Girma",    role: "Freelancer — Mobile Developer",  location: "Mekelle",     avatar: "HG", gradient: "from-orange-500 to-amber-600",   rating: 5, text: "The verification badge really helped me stand out. Clients trust me more knowing I'm verified. I've completed 40+ projects and the escrow system protects both sides perfectly." },
];

const AUTO_INTERVAL = 5000;

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [visible, setVisible] = useState(true);
  const count = TESTIMONIALS.length;

  const goTo = useCallback((index: number, dir: "left" | "right") => {
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => { setCurrent(index); setVisible(true); }, 200);
  }, []);

  const prev = useCallback(() => goTo((current - 1 + count) % count, "left"),  [current, count, goTo]);
  const next = useCallback(() => goTo((current + 1) % count, "right"),          [current, count, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [paused, next]);

  const t = TESTIMONIALS[current];

  return (
    <section className="glass-section py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">What Our Community Says</h2>
          <p className="text-gray-500 text-sm">Real stories from Ethiopian freelancers and clients.</p>
        </div>

        {/* Testimonial glass card */}
        <div
          className="relative rounded-3xl p-8 sm:p-10"
          style={{
            background: "var(--glass-bg-strong)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow), inset 0 1px 0 var(--glass-border-inner)",
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Large quote decoration */}
          <Quote
            className="absolute top-6 right-8 w-12 h-12 pointer-events-none"
            style={{ color: "rgba(34,197,94,0.20)" }}
          />

          {/* Animated content */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : animDir === "right" ? "translateX(-20px)" : "translateX(20px)",
              transition: "opacity 0.22s ease, transform 0.22s ease",
            }}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-5">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>

            <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-7 italic">
              &ldquo;{t.text}&rdquo;
            </p>

            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 bg-gradient-to-br ${t.gradient} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
                {t.avatar}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                <div className="text-xs text-gray-500">{t.role} · {t.location}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > current ? "right" : "left")}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2 bg-emerald-400" : "w-2 h-2 bg-gray-300/50 hover:bg-gray-300"}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {[{ fn: prev, label: "Previous", icon: ChevronLeft }, { fn: next, label: "Next", icon: ChevronRight }].map(({ fn, label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={fn}
                  aria-label={`${label} testimonial`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.40)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
