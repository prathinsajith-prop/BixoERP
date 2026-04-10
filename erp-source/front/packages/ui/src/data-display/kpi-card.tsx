"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  trend?: "up" | "down" | "flat";
  icon?: React.ReactNode;
  subtitle?: string;
}

export function KPICard({ title, value, change, trend, icon, subtitle }: KPICardProps) {
  return (
    <div
      className="gogo-card p-6"
      style={{ backgroundColor: 'var(--gogo-surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-card)')}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-secondary)' }}>{title}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--gogo-text-primary)' }}>{value}</p>
          {(change !== undefined || subtitle) && (
            <div className="mt-1 flex items-center gap-1.5">
              {change !== undefined && (
                <span
                  className={`text-sm font-medium ${
                    trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}{" "}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
              {subtitle && <span className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' }}>{icon}</div>
        )}
      </div>
    </div>
  );
}
