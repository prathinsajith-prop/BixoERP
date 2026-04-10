"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

type LinkColor = "default" | "primary" | "secondary" | "error" | "warning" | "info" | "success";
type LinkUnderline = "none" | "hover" | "always";

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "color"> {
    href: string;
    color?: LinkColor;
    underline?: LinkUnderline;
    disabled?: boolean;
    external?: boolean;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
}

const colorMap: Record<LinkColor, string> = {
    default: "var(--gogo-text-primary)",
    primary: "var(--gogo-primary)",
    secondary: "var(--gogo-text-secondary)",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#0ea5e9",
    success: "#22c55e",
};

const underlineMap: Record<LinkUnderline, string> = {
    none: "no-underline",
    hover: "no-underline hover:underline",
    always: "underline",
};

export function Link({
    href,
    children,
    color = "primary",
    underline = "hover",
    disabled = false,
    external = false,
    prefixIcon,
    suffixIcon,
    className = "",
    target,
    rel,
    ...props
}: LinkProps) {
    const isExternal = external || target === "_blank";
    return (
        <a
            href={disabled ? undefined : href}
            target={isExternal ? "_blank" : target}
            rel={isExternal ? "noopener noreferrer" : rel}
            className={`inline-flex items-center gap-1 transition-colors text-sm ${underlineMap[underline]} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`}
            style={{ color: colorMap[color] }}
            aria-disabled={disabled}
            {...props}
        >
            {prefixIcon && <span className="flex-shrink-0">{prefixIcon}</span>}
            {children}
            {suffixIcon && <span className="flex-shrink-0">{suffixIcon}</span>}
            {isExternal && !suffixIcon && <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />}
        </a>
    );
}
