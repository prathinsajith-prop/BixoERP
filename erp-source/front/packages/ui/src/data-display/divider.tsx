"use client";

import React from "react";

export interface DividerProps {
    orientation?: "horizontal" | "vertical";
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function Divider({ orientation = "horizontal", children, className = "", style }: DividerProps) {
    if (orientation === "vertical") {
        return (
            <span
                className={`inline-block self-stretch w-px ${className}`}
                style={{ backgroundColor: "var(--gogo-divider)", ...style }}
                role="separator"
                aria-orientation="vertical"
            />
        );
    }

    if (children) {
        return (
            <div className={`flex items-center gap-3 ${className}`} role="separator">
                <span className="flex-1 h-px" style={{ backgroundColor: "var(--gogo-divider)" }} />
                <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--gogo-text-secondary)" }}>
                    {children}
                </span>
                <span className="flex-1 h-px" style={{ backgroundColor: "var(--gogo-divider)" }} />
            </div>
        );
    }

    return (
        <hr
            className={`border-0 h-px ${className}`}
            style={{ backgroundColor: "var(--gogo-divider)", ...style }}
            role="separator"
        />
    );
}
