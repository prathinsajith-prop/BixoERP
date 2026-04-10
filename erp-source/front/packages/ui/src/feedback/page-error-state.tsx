"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface PageErrorStateProps {
    error?: string | Error;
    title?: string;
    description?: string;
    onRetry?: () => void;
    retryLabel?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageErrorState({
    error,
    title = "Something went wrong",
    description,
    onRetry,
    retryLabel = "Try again",
    children,
    className = "",
}: PageErrorStateProps) {
    const message = description ?? (error instanceof Error ? error.message : typeof error === "string" ? error : undefined);

    return (
        <div className={`flex flex-col items-center justify-center min-h-[16rem] gap-4 p-8 text-center ${className}`}>
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-1 max-w-sm">
                <h2 className="text-base font-semibold" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>{title}</h2>
                {message && <p className="text-sm" style={{ color: "var(--gogo-text-secondary)" }}>{message}</p>}
            </div>
            {children}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="gogo-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] hover:bg-[var(--gogo-grey-100)] transition-colors"
                    style={{ borderRadius: "var(--radius-btn)", color: "var(--gogo-text-primary)" }}
                >
                    <RefreshCw className="w-4 h-4" />
                    {retryLabel}
                </button>
            )}
        </div>
    );
}
