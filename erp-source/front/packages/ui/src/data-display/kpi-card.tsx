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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
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
              {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
        )}
      </div>
    </div>
  );
}
