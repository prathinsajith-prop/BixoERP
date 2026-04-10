"use client";

import React from "react";

export interface TimelineEvent {
    id?: string | number;
    title: string;
    description?: string;
    timestamp?: string;
    icon?: React.ReactNode;
    color?: "primary" | "secondary" | "success" | "error" | "warning" | "info" | "default";
}

export interface TimelineProps {
    events: TimelineEvent[];
    loading?: boolean;
    className?: string;
}

const dotColorMap: Record<NonNullable<TimelineEvent["color"]>, string> = {
    default: "var(--gogo-grey-100)",
    primary: "var(--gogo-primary)",
    secondary: "#a855f7",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#0ea5e9",
};

const dotForeMap: Record<NonNullable<TimelineEvent["color"]>, string> = {
    default: "var(--gogo-text-secondary)",
    primary: "#fff",
    secondary: "#fff",
    success: "#fff",
    error: "#fff",
    warning: "#fff",
    info: "#fff",
};

export function Timeline({ events, loading = false, className = "" }: TimelineProps) {
    if (loading) {
        return (
            <div className={`space-y-4 ${className}`}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                            <div className="w-0.5 flex-1 bg-gray-100 mt-1" />
                        </div>
                        <div className="pb-6 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <p className="text-sm" style={{ color: "var(--gogo-text-secondary)" }}>No events to display</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${className}`}>
            {events.map((event, idx) => {
                const color = event.color ?? "primary";
                const isLast = idx === events.length - 1;
                return (
                    <div key={event.id ?? idx} className="flex gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: dotColorMap[color], color: dotForeMap[color] }}
                            >
                                {event.icon ?? <span>{(event.title[0] ?? "?").toUpperCase()}</span>}
                            </div>
                            {!isLast && (
                                <div className="w-0.5 flex-1 min-h-[1.5rem] mt-1" style={{ backgroundColor: "var(--gogo-divider)" }} />
                            )}
                        </div>
                        <div className={`${isLast ? "" : "pb-6"} flex-1 min-w-0`}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium" style={{ color: "var(--gogo-text-primary)" }}>{event.title}</p>
                                {event.timestamp && (
                                    <span className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{event.timestamp}</span>
                                )}
                            </div>
                            {event.description && (
                                <p className="text-sm mt-0.5" style={{ color: "var(--gogo-text-secondary)" }}>{event.description}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
