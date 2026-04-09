"use client";

import React from "react";

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  pulse?: boolean;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ── Positive ────────────────────────────────────────────────────────────────
  active: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a", pulse: true },
  approved: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  paid: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  completed: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  posted: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  delivered: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  done: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  received: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  processed: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  verified: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  confirmed: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a" },
  enabled: { bg: "rgba(22,163,74,0.10)", text: "#15803d", dot: "#16a34a", pulse: true },
  // ── Warning / in-progress ───────────────────────────────────────────────────
  pending: { bg: "rgba(217,119,6,0.10)", text: "#b45309", dot: "#d97706" },
  "in-progress": { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7", pulse: true },
  partial: { bg: "rgba(217,119,6,0.10)", text: "#b45309", dot: "#d97706" },
  "on-hold": { bg: "rgba(217,119,6,0.10)", text: "#b45309", dot: "#d97706" },
  "soft-closed": { bg: "rgba(217,119,6,0.10)", text: "#b45309", dot: "#d97706" },
  review: { bg: "rgba(168,85,247,0.10)", text: "#7e22ce", dot: "#a855f7" },
  probation: { bg: "rgba(217,119,6,0.10)", text: "#b45309", dot: "#d97706" },
  notice: { bg: "rgba(234,88,12,0.10)", text: "#c2410c", dot: "#ea580c" },
  planning: { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7" },
  submitted: { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7" },
  sent: { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7" },
  released: { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7" },
  calculated: { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7" },
  draft: { bg: "rgba(107,114,128,0.10)", text: "#374151", dot: "#6b7280" },
  // ── Negative ────────────────────────────────────────────────────────────────
  inactive: { bg: "rgba(107,114,128,0.10)", text: "#374151", dot: "#6b7280" },
  cancelled: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  rejected: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  overdue: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  terminated: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  void: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  reversed: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  "hard-closed": { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  obsolete: { bg: "rgba(220,38,38,0.10)", text: "#b91c1c", dot: "#dc2626" },
  disabled: { bg: "rgba(107,114,128,0.10)", text: "#374151", dot: "#6b7280" },
  // ── Neutral ─────────────────────────────────────────────────────────────────
  open: { bg: "rgba(2,132,199,0.10)", text: "#0369a1", dot: "#0284c7" },
  closed: { bg: "rgba(107,114,128,0.10)", text: "#374151", dot: "#6b7280" },
  escalated: { bg: "rgba(234,88,12,0.10)", text: "#c2410c", dot: "#ea580c" },
  "on-leave": { bg: "rgba(168,85,247,0.10)", text: "#7e22ce", dot: "#a855f7" },
};

const DEFAULT_CONFIG: StatusConfig = {
  bg: "rgba(107,114,128,0.10)",
  text: "#374151",
  dot: "#6b7280",
};

export function StatusBadge({ status, label, className = "" }: BadgeProps) {
  // Normalise: lowercase + underscores → hyphens  (e.g. "IN_PROGRESS" → "in-progress")
  const key = status.toLowerCase().replace(/_/g, "-");
  const cfg = STATUS_CONFIG[key] ?? DEFAULT_CONFIG;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold select-none ${className}`}
      style={{
        background: cfg.bg,
        color: cfg.text,
        borderRadius: "var(--radius-chip, 999px)",
        border: `1px solid ${cfg.dot}33`,
        letterSpacing: "0.015em",
        lineHeight: "1.6",
        whiteSpace: "nowrap",
      }}
    >
      {/* Status dot — pulses for live/active states */}
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0${cfg.pulse ? " animate-pulse" : ""}`}
        style={{ backgroundColor: cfg.dot }}
      />
      {label ?? key.replace(/-/g, " ")}
    </span>
  );
}
