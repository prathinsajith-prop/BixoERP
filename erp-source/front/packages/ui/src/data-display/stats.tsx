"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatMetric {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
    trend?: number; // positive = up, negative = down
    trendLabel?: string;
    prefix?: string;
    suffix?: string;
    format?: "number" | "currency" | "percent" | "none";
}

export interface StatsProps {
    metrics: StatMetric[];
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}

const colorMap = {
    primary: { text: "var(--gogo-primary)", bg: "rgba(99,102,241,0.1)" },
    secondary: { text: "#a855f7", bg: "rgba(168,85,247,0.1)" },
    success: { text: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    error: { text: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    warning: { text: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    info: { text: "#0ea5e9", bg: "rgba(14,165,233,0.1)" },
};

function formatValue(value: string | number, format?: StatMetric["format"], prefix?: string, suffix?: string): string {
    let formatted = String(value);
    if (typeof value === "number") {
        if (format === "number") formatted = value.toLocaleString();
        else if (format === "currency") formatted = value.toLocaleString(undefined, { style: "currency", currency: "USD" });
        else if (format === "percent") formatted = `${value}%`;
        else formatted = String(value);
    }
    return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
}

export function Stats({ metrics, columns = 3, className = "" }: StatsProps) {
    const colClass = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" }[columns];

    return (
        <div className={`grid ${colClass} gap-4 ${className}`}>
            {metrics.map((metric, idx) => {
                const colors = colorMap[metric.color ?? "primary"];
                return (
                    <div
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-lg"
                        style={{ backgroundColor: "var(--gogo-surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-card)" }}
                    >
                        {metric.icon && (
                            <div
                                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                                {metric.icon}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide mb-1 truncate" style={{ color: "var(--gogo-text-secondary)" }}>
                                {metric.label}
                            </p>
                            <p className="text-2xl font-bold" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>
                                {formatValue(metric.value, metric.format, metric.prefix, metric.suffix)}
                            </p>
                            {metric.trend !== undefined && (
                                <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${metric.trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                                    {metric.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{Math.abs(metric.trend)}%</span>
                                    {metric.trendLabel && <span className="font-normal" style={{ color: "var(--gogo-text-secondary)" }}>{metric.trendLabel}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
