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

const colorMap: Record<NonNullable<StatMetric["color"]>, { text: string; bg: string; border: string }> = {
    primary: { text: "var(--gogo-primary)", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.18)" },
    secondary: { text: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.18)" },
    success: { text: "#16a34a", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.18)" },
    error: { text: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.18)" },
    warning: { text: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.18)" },
    info: { text: "#0284c7", bg: "rgba(2,132,199,0.08)", border: "rgba(2,132,199,0.18)" },
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
    const colClass = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 lg:grid-cols-4",
    }[columns];

    return (
        <div className={`grid ${colClass} gap-3 ${className}`}>
            {metrics.map((metric, idx) => {
                const colors = colorMap[metric.color ?? "primary"];
                return (
                    <div
                        key={idx}
                        className="relative flex items-center gap-3.5 px-4 py-3.5 overflow-hidden"
                        style={{
                            backgroundColor: "var(--gogo-surface)",
                            boxShadow: "var(--shadow-card)",
                            borderRadius: "var(--radius-card)",
                            border: "1px solid var(--gogo-divider)",
                        }}
                    >
                        {/* Subtle left accent bar */}
                        <span
                            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                            style={{ backgroundColor: colors.text, opacity: 0.7 }}
                        />

                        {/* Icon */}
                        {metric.icon && (
                            <div
                                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                                {metric.icon}
                            </div>
                        )}

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-[11px] font-semibold uppercase tracking-wider leading-none mb-1.5 truncate"
                                style={{ color: "var(--gogo-text-secondary)" }}
                            >
                                {metric.label}
                            </p>
                            <p
                                className="text-[22px] font-bold leading-none tabular-nums"
                                style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}
                            >
                                {formatValue(metric.value, metric.format, metric.prefix, metric.suffix)}
                            </p>
                            {metric.trend !== undefined && (
                                <div
                                    className={`inline-flex items-center gap-0.5 mt-1.5 text-[11px] font-semibold ${metric.trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                                        }`}
                                >
                                    {metric.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{Math.abs(metric.trend)}%</span>
                                    {metric.trendLabel && (
                                        <span className="font-normal ml-0.5" style={{ color: "var(--gogo-text-secondary)" }}>
                                            {metric.trendLabel}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
