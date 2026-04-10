"use client";

import React from "react";

export interface ListItemButtonProps {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    selected?: boolean;
    dense?: boolean;
    divider?: boolean;
    className?: string;
}

export const ListItemButton = React.forwardRef<HTMLDivElement, ListItemButtonProps>(
    ({ children, onClick, disabled = false, selected = false, dense = false, divider = false, className = "" }, ref) => {
        return (
            <div
                ref={ref}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={!disabled ? onClick : undefined}
                onKeyDown={(e) => !disabled && e.key === "Enter" && onClick?.()}
                className={`w-full flex items-center ${dense ? "px-4 py-1.5" : "px-4 py-2.5"} transition-colors focus:outline-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${divider ? "border-b" : ""} ${className}`}
                style={{
                    borderColor: divider ? "var(--gogo-divider)" : undefined,
                    backgroundColor: selected ? "rgba(var(--gogo-primary-rgb, 99,102,241), 0.08)" : undefined,
                    color: selected ? "var(--gogo-primary)" : "var(--gogo-text-primary)",
                }}
                onMouseEnter={(e) => !disabled && !selected && (e.currentTarget.style.backgroundColor = "var(--gogo-grey-100)")}
                onMouseLeave={(e) => !disabled && !selected && (e.currentTarget.style.backgroundColor = "")}
                aria-disabled={disabled}
                aria-selected={selected}
            >
                {children}
            </div>
        );
    }
);

ListItemButton.displayName = "ListItemButton";
