"use client";

import React, { useState } from "react";
import { Star, Heart } from "lucide-react";

export interface RatingProps {
    name?: string;
    value?: number;
    defaultValue?: number;
    label?: string;
    max?: number;
    size?: "small" | "medium" | "large";
    icon?: "star" | "heart";
    allowHalf?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    onChange?: (value: number | null) => void;
    helperText?: string;
    className?: string;
}

const iconSizeMap = { small: "w-4 h-4", medium: "w-6 h-6", large: "w-8 h-8" };

export function Rating({
    name,
    value,
    defaultValue = 0,
    label,
    max = 5,
    size = "medium",
    icon = "star",
    readonly = false,
    disabled = false,
    required = false,
    onChange,
    helperText,
    className = "",
}: RatingProps) {
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState(defaultValue);
    const [hover, setHover] = useState(-1);
    const current = isControlled ? value! : internal;

    const handleClick = (v: number) => {
        if (readonly || disabled) return;
        const next = current === v ? 0 : v;
        if (!isControlled) setInternal(next);
        onChange?.(next === 0 ? null : next);
    };

    const IconComp = icon === "heart" ? Heart : Star;
    const iconClass = iconSizeMap[size];

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="block text-sm font-medium" style={{ color: "var(--gogo-text-primary)" }}>
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <div
                className={`flex items-center gap-0.5 ${disabled ? "opacity-50" : ""}`}
                role="radiogroup"
                aria-label={label || "rating"}
            >
                {Array.from({ length: max }, (_, i) => {
                    const v = i + 1;
                    const filled = v <= (hover > 0 ? hover : current);
                    return (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={current === v}
                            onClick={() => handleClick(v)}
                            onMouseEnter={() => !readonly && !disabled && setHover(v)}
                            onMouseLeave={() => !readonly && !disabled && setHover(-1)}
                            disabled={disabled || readonly}
                            className={`transition-transform focus:outline-none ${!readonly && !disabled ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
                            aria-label={`${v} ${icon}`}
                        >
                            <IconComp
                                className={iconClass}
                                fill={filled ? "currentColor" : "none"}
                                style={{ color: filled ? (icon === "heart" ? "#ef4444" : "#f59e0b") : "var(--gogo-text-secondary)" }}
                            />
                        </button>
                    );
                })}
            </div>
            {name && <input type="hidden" name={name} value={current} required={required} />}
            {helperText && <p className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{helperText}</p>}
        </div>
    );
}
