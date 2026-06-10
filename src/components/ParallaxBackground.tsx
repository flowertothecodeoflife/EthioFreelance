"use client";

import { useTheme } from "./ThemeProvider";

/**
 * ParallaxBackground
 *
 * A fixed full-viewport background image that stays visible at all times —
 * both behind the hero and behind all the glass sections below it.
 * No parallax movement needed; position:fixed on the outer shell handles it.
 */
export default function ParallaxBackground() {
  const { theme } = useTheme();

  // No scroll logic needed — position:fixed on the outer shell keeps the
  // background anchored to the viewport at all scroll positions.

  const isDark = theme === "dark";

  return (
    // Outer shell: fixed to viewport, sits behind everything
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -2,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Inner container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        {/* ── Light mode image ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/light-mode-background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.90)",
            opacity: isDark ? 0 : 1,
            transition: "opacity 0.8s ease",
          }}
        />

        {/* ── Night mode image ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/night-mode-background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.70)",
            opacity: isDark ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        />

        {/* ── Subtle colour tint overlay ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "rgba(5, 10, 20, 0.38)"
              : "rgba(236, 253, 245, 0.22)",
            transition: "background 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}
