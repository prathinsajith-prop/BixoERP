"use client";

import React from "react";
import { Chip } from "../data-display/chip";
import { Drawer } from "./drawer";
import { Loader2 } from "lucide-react";

export interface QuickPreviewChip {
    label: string;
    color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export interface QuickPreviewAction {
    label: string;
    onClick: () => void;
    variant?: "primary" | "outline" | "ghost";
    startIcon?: React.ReactNode;
}

export interface QuickPreviewDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    chips?: QuickPreviewChip[];
    actions?: QuickPreviewAction[];
    loading?: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg";
}

export function QuickPreviewDrawer({
    open,
    onClose,
    title,
    subtitle,
    icon,
    chips,
    actions,
    loading = false,
    children,
    footer,
    size = "md",
}: QuickPreviewDrawerProps) {
    const headerContent = (
        <div className="space-y-3">
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--gogo-grey-100)" }}>
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>{title}</h3>
                    {subtitle && <p className="text-sm truncate mt-0.5" style={{ color: "var(--gogo-text-secondary)" }}>{subtitle}</p>}
                </div>
            </div>
            {chips && chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {chips.map((chip, i) => (
                        <Chip key={i} label={chip.label} color={chip.color ?? "default"} size="small" variant="outlined" />
                    ))}
                </div>
            )}
            {actions && actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {actions.map((action, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={action.onClick}
                            className={`gogo-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${action.variant === "primary"
                                ? "gogo-btn-primary shadow-[var(--shadow-card)]"
                                : action.variant === "ghost"
                                    ? "bg-transparent hover:bg-[var(--gogo-grey-100)]"
                                    : "border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] hover:bg-[var(--gogo-grey-100)]"
                                }`}
                            style={{ borderRadius: "var(--radius-btn)", color: action.variant === "primary" ? undefined : "var(--gogo-text-primary)" }}
                        >
                            {action.startIcon}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Drawer
            open={open}
            onClose={onClose}
            anchor="right"
            size={size}
            footer={footer}
        >
            <div className="space-y-4">
                {headerContent}
                <div className="h-px" style={{ backgroundColor: "var(--gogo-divider)" }} />
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gogo-primary)" }} />
                    </div>
                ) : (
                    children
                )}
            </div>
        </Drawer>
    );
}
