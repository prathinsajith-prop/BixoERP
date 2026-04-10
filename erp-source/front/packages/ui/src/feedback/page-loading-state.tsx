"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface PageLoadingStateProps {
    message?: string;
    description?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const spinnerSizeMap = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-14 h-14" };

export function PageLoadingState({
    message = "Loading...",
    description,
    size = "md",
    className = "",
}: PageLoadingStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center min-h-[16rem] gap-4 p-8 text-center ${className}`}>
            <Loader2 className={`animate-spin ${spinnerSizeMap[size]}`} style={{ color: "var(--gogo-primary)" }} />
            {message && (
                <div className="space-y-1">
                    <p className="text-sm font-medium" style={{ color: "var(--gogo-text-primary)" }}>{message}</p>
                    {description && <p className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{description}</p>}
                </div>
            )}
        </div>
    );
}
