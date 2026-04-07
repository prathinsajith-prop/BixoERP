"use client";

import React from "react";
import { X } from "lucide-react";

type ChipVariant = "filled" | "outlined";
type ChipColor = "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success";
type ChipSize = "small" | "medium";

export interface ChipProps {
    label?: React.ReactNode;
    children?: React.ReactNode;
    variant?: ChipVariant;
    color?: ChipColor;
    size?: ChipSize;
    icon?: React.ReactNode;
    onDelete?: () => void;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

const colorClasses: Record<ChipVariant, Record<ChipColor, string>> = {
    filled: {
        default: "bg-[var(--gogo-grey-100)] text-[var(--gogo-text-primary)]",
        primary: "bg-[var(--gogo-primary)] text-white",
        secondary: "bg-purple-500 text-white",
        error: "bg-red-500 text-white",
        warning: "bg-yellow-500 text-white",
        info: "bg-sky-500 text-white",
        success: "bg-green-500 text-white",
    },
    outlined: {
        default: "border border-[var(--gogo-divider)] bg-transparent text-[var(--gogo-text-primary)]",
        primary: "border border-[var(--gogo-primary)] bg-transparent text-[var(--gogo-primary)]",
        secondary: "border border-purple-500 bg-transparent text-purple-500",
        error: "border border-red-500 bg-transparent text-red-500",
        warning: "border border-yellow-500 bg-transparent text-yellow-600",
        info: "border border-sky-500 bg-transparent text-sky-500",
        success: "border border-green-500 bg-transparent text-green-500",
    },
};

const sizeClasses: Record<ChipSize, string> = {
    small: "h-6 px-2 text-xs gap-1",
    medium: "h-7 px-3 text-sm gap-1.5",
};

export function Chip({
    label,
    children,
    variant = "filled",
    color = "default",
    size = "medium",
    icon,
    onDelete,
    onClick,
    disabled = false,
    className = "",
}: ChipProps) {
    const content = label ?? children;
    return (
        <span
            className={`gogo-chip inline-flex items-center font-medium transition-colors ${sizeClasses[size]} ${colorClasses[variant][color]} ${onClick && !disabled ? "cursor-pointer hover:opacity-80" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
            style={{ borderRadius: "var(--radius-chip)" }}
            onClick={!disabled && onClick ? onClick : undefined}
            role={onClick ? "button" : undefined}
            tabIndex={onClick && !disabled ? 0 : undefined}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{content}</span>
            {onDelete && !disabled && (
                <button
                    type="button"
                    className="flex-shrink-0 rounded-full hover:opacity-70 focus:outline-none"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    aria-label="Remove"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
