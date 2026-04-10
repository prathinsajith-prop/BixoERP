"use client";

import React from "react";

type IconButtonSize = "small" | "medium" | "large";
type IconButtonColor = "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success" | "inherit";
type IconButtonVariant = "text" | "outlined" | "contained";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: IconButtonSize;
    color?: IconButtonColor;
    variant?: IconButtonVariant;
    ariaLabel?: string;
}

const sizeClasses: Record<IconButtonSize, string> = {
    small: "p-1.5",
    medium: "p-2",
    large: "p-2.5",
};

const colorClasses: Record<IconButtonColor, { text: string; hover: string }> = {
    default: { text: "var(--gogo-text-secondary)", hover: "var(--gogo-grey-100)" },
    primary: { text: "var(--gogo-primary)", hover: "rgba(var(--gogo-primary-rgb, 99,102,241), 0.08)" },
    secondary: { text: "#a855f7", hover: "#f3e8ff" },
    error: { text: "#ef4444", hover: "#fee2e2" },
    warning: { text: "#f59e0b", hover: "#fef3c7" },
    info: { text: "#0ea5e9", hover: "#e0f2fe" },
    success: { text: "#22c55e", hover: "#dcfce7" },
    inherit: { text: "inherit", hover: "transparent" },
};

const variantBorder: Record<IconButtonVariant, string> = {
    text: "border border-transparent",
    outlined: "border",
    contained: "border border-transparent",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ size = "medium", color = "default", variant = "text", ariaLabel, className = "", disabled, children, style, ...props }, ref) => {
        const { text, hover } = colorClasses[color];
        return (
            <button
                ref={ref}
                type="button"
                className={`inline-flex items-center justify-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantBorder[variant]} ${className}`}
                style={{ color: text, ["--hover-bg" as any]: hover, ...style } as React.CSSProperties}
                disabled={disabled}
                aria-label={ariaLabel}
                onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = hover)}
                onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = variant === "contained" ? hover : "transparent")}
                {...props}
            >
                {children}
            </button>
        );
    }
);

IconButton.displayName = "IconButton";
