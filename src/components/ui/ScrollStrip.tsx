"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollStripProps {
  children: React.ReactNode;
  className?: string;
  /** px per animation frame while hovering — default 4 */
  speed?: number;
}

export default function ScrollStrip({
  children,
  className = "",
  speed = 4,
}: ScrollStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Use refs for the RAF loop — no state involved so no re-render issues
  const rafRef    = useRef<number | null>(null);
  const dirRef    = useRef<0 | 1 | -1>(0);

  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  // ── Update arrow visiblity ──────────────────────────────────────────────────
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Run once after mount so the right arrow shows immediately
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── RAF scroll loop ─────────────────────────────────────────────────────────
  const startScroll = (dir: 1 | -1) => {
    // Cancel any running loop first
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    dirRef.current = dir;

    const tick = () => {
      const el = scrollRef.current;
      if (!el || dirRef.current === 0) return;
      el.scrollLeft += speed * dirRef.current;
      updateArrows();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopScroll = () => {
    dirRef.current = 0;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Click = smooth scroll by ~70% of visible width
  const clickScroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  // Cleanup on unmount
  useEffect(() => () => stopScroll(), []);

  return (
    // overflow-visible so the arrows (which sit inside) are never clipped
    <div className="relative">

      {/* ── Left arrow ── */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => clickScroll(-1)}
        onMouseEnter={() => startScroll(-1)}
        onMouseLeave={stopScroll}
        style={{ transition: "opacity 0.15s, transform 0.15s" }}
        className={[
          "absolute left-1 top-1/2 -translate-y-[calc(50%+8px)] z-20",
          "w-9 h-9 rounded-full",
          "bg-white/95 border border-gray-200 shadow-md",
          "flex items-center justify-center",
          "text-gray-600 hover:text-green-700 hover:border-green-400 hover:scale-110",
          canLeft
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* ── Scroll container ── */}
      <div
        ref={scrollRef}
        className={[
          "flex gap-4 overflow-x-auto pb-4 scrollbar-hide",
          // No snap — snap fights the RAF continuous scroll
          className,
        ].join(" ")}
      >
        {children}
      </div>

      {/* ── Right arrow ── */}
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => clickScroll(1)}
        onMouseEnter={() => startScroll(1)}
        onMouseLeave={stopScroll}
        style={{ transition: "opacity 0.15s, transform 0.15s" }}
        className={[
          "absolute right-1 top-1/2 -translate-y-[calc(50%+8px)] z-20",
          "w-9 h-9 rounded-full",
          "bg-white/95 border border-gray-200 shadow-md",
          "flex items-center justify-center",
          "text-gray-600 hover:text-green-700 hover:border-green-400 hover:scale-110",
          canRight
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
