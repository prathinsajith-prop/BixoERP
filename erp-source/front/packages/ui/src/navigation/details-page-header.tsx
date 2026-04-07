"use client";

import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Chip } from "../data-display/chip";
import { Breadcrumb, BreadcrumbItem } from "./breadcrumb";

export interface DetailsPageHeaderAction {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline" | "ghost" | "danger";
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface DetailsPageHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    onBack?: () => void;
    breadcrumbs?: BreadcrumbItem[];
    status?: string;
    statusColor?: "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success";
    actions?: DetailsPageHeaderAction[];
    icon?: React.ReactNode;
    meta?: React.ReactNode;
    className?: string;
}

const actionVariantClass: Record<NonNullable<DetailsPageHeaderAction["variant"]>, string> = {
    primary: "gogo-btn-primary shadow-[var(--shadow-card)]",
    outline: "border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] hover:bg-[var(--gogo-grey-100)]",
    ghost: "bg-transparent hover:bg-[var(--gogo-grey-100)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
};

export function DetailsPageHeader({
    title,
    subtitle,
    backHref,
    onBack,
    breadcrumbs,
    status,
    statusColor = "default",
    actions = [],
    icon,
    meta,
    className = "",
}: DetailsPageHeaderProps) {
    const handleBack = () => {
        if (onBack) { onBack(); return; }
        if (backHref) { window.location.href = backHref; }
        else { window.history.back(); }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {(backHref || onBack || breadcrumbs) && (
                <div className="flex items-center gap-2">
                    {(backHref || onBack) && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex items-center gap-1 text-sm transition-colors"
                            style={{ color: "var(--gogo-text-secondary)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gogo-text-secondary)")}
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <Breadcrumb items={breadcrumbs} />
                    )}
                </div>
            )}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                    {icon && (
                        <div
                            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: "var(--gogo-grey-100)" }}
                        >
                            {icon}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1
                                className="text-xl font-semibold"
                                style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}
                            >
                                {title}
                            </h1>
                            {status && (
                                <Chip label={status} color={statusColor} size="small" variant="outlined" />
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-sm mt-0.5" style={{ color: "var(--gogo-text-secondary)" }}>{subtitle}</p>
                        )}
                        {meta && <div className="mt-1">{meta}</div>}
                    </div>
                </div>
                {actions.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className={`gogo-btn inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionVariantClass[action.variant ?? "outline"]}`}
                                style={{
                                    borderRadius: "var(--radius-btn)",
                                    color: action.variant === "primary" || action.variant === "danger" ? undefined : "var(--gogo-text-primary)",
                                }}
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
