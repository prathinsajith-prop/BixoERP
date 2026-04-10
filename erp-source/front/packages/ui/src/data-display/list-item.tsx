"use client";

import React from "react";

export interface ListItemProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    badge?: string | number;
    badgeColor?: "default" | "primary" | "error" | "warning" | "success" | "info";
    onClick?: () => void;
    selected?: boolean;
    disabled?: boolean;
    dense?: boolean;
    disablePadding?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const badgeColorMap: Record<NonNullable<ListItemProps["badgeColor"]>, string> = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    success: "bg-green-100 text-green-700",
    info: "bg-sky-100 text-sky-700",
};

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
    ({ label, description, icon, badge, badgeColor = "default", onClick, selected, disabled, dense, disablePadding, className = "", children }, ref) => {
        const paddingClass = disablePadding ? "" : dense ? "px-4 py-1.5" : "px-4 py-2.5";

        return (
            <li
                ref={ref}
                className={`flex items-center gap-3 ${paddingClass} ${selected ? "font-medium" : ""} ${disabled ? "opacity-50" : ""} ${className}`}
                style={selected ? { backgroundColor: "rgba(var(--gogo-primary-rgb, 99,102,241), 0.08)", color: "var(--gogo-primary)" } : {}}
                onClick={!disabled ? onClick : undefined}
                aria-selected={selected}
                aria-disabled={disabled}
            >
                {icon && (
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center" style={{ color: "var(--gogo-text-secondary)" }}>
                        {icon}
                    </span>
                )}
                {children ? children : (
                    <div className="flex-1 min-w-0">
                        {label && <p className="text-sm truncate" style={{ color: "var(--gogo-text-primary)" }}>{label}</p>}
                        {description && <p className="text-xs truncate mt-0.5" style={{ color: "var(--gogo-text-secondary)" }}>{description}</p>}
                    </div>
                )}
                {badge !== undefined && (
                    <span className={`ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorMap[badgeColor]}`}>
                        {badge}
                    </span>
                )}
            </li>
        );
    }
);

ListItem.displayName = "ListItem";
