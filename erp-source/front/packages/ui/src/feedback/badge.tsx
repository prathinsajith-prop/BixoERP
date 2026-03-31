"use client";

import React from "react";
import { statusColor } from "@erp/shared";

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = "" }: BadgeProps) {
  const colorClass = statusColor(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass} ${className}`}
    >
      {label || status.replace(/-/g, " ")}
    </span>
  );
}
