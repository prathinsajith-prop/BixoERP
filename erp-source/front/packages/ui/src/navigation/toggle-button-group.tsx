"use client";

import React from "react";

export interface ToggleOption {
    value: string;
    label?: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
    ariaLabel?: string;
}

export interface ToggleButtonGroupProps {
    options: ToggleOption[];
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
    exclusive?: boolean;
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
}

const sizeClasses = {
    small: "px-2.5 py-1 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-5 py-2.5 text-base",
};

export function ToggleButtonGroup({
    options,
    value,
    onChange,
    exclusive = true,
    size = "medium",
    disabled = false,
    className = "",
    fullWidth = false,
}: ToggleButtonGroupProps) {
    const isSelected = (v: string): boolean => {
        if (!value) return false;
        if (Array.isArray(value)) return value.includes(v);
        return value === v;
    };

    const handleClick = (v: string) => {
        if (disabled) return;
        if (exclusive) {
            onChange?.(value === v ? "" : v);
        } else {
            const arr = Array.isArray(value) ? [...value] : value ? [value] : [];
            const idx = arr.indexOf(v);
            if (idx === -1) onChange?.([...arr, v]);
            else onChange?.(arr.filter((x) => x !== v));
        }
    };

    return (
        <div
            role="group"
            className={`inline-flex rounded-lg overflow-hidden border ${fullWidth ? "w-full" : ""} ${disabled ? "opacity-50" : ""} ${className}`}
            style={{ borderColor: "var(--gogo-divider)" }}
        >
            {options.map((opt, idx) => {
                const selected = isSelected(opt.value);
                const isFirst = idx === 0;
                const isLast = idx === options.length - 1;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={opt.ariaLabel ?? (typeof opt.label === "string" ? opt.label : opt.value)}
                        disabled={disabled || opt.disabled}
                        onClick={() => handleClick(opt.value)}
                        className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${fullWidth ? "flex-1" : ""} ${!isFirst ? "border-l" : ""}`}
                        style={{
                            borderLeftColor: !isFirst ? "var(--gogo-divider)" : undefined,
                            backgroundColor: selected ? "var(--gogo-primary)" : "var(--gogo-surface)",
                            color: selected ? "#fff" : "var(--gogo-text-primary)",
                        }}
                        onMouseEnter={(e) => !selected && !disabled && !opt.disabled && (e.currentTarget.style.backgroundColor = "var(--gogo-grey-100)")}
                        onMouseLeave={(e) => !selected && !disabled && !opt.disabled && (e.currentTarget.style.backgroundColor = "var(--gogo-surface)")}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
