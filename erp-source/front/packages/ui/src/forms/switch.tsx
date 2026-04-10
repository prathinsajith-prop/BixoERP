"use client";

import React from "react";

export interface SwitchProps {
    name?: string;
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    size?: "small" | "medium" | "large";
    labelPlacement?: "start" | "end";
    helperText?: string;
    className?: string;
}

const trackSizeMap = {
    small: { track: "w-8 h-4", thumb: "w-3 h-3", translateX: "translate-x-4" },
    medium: { track: "w-10 h-5", thumb: "w-4 h-4", translateX: "translate-x-5" },
    large: { track: "w-12 h-6", thumb: "w-5 h-5", translateX: "translate-x-6" },
};

export function Switch({
    name,
    label,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    size = "medium",
    labelPlacement = "end",
    helperText,
    className = "",
}: SwitchProps) {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const isChecked = isControlled ? checked : internal;

    const { track, thumb, translateX } = trackSizeMap[size];

    const handleChange = () => {
        if (disabled) return;
        const next = !isChecked;
        if (!isControlled) setInternal(next);
        onChange?.(next);
    };

    const switchEl = (
        <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            aria-disabled={disabled}
            disabled={disabled}
            name={name}
            onClick={handleChange}
            className={`relative inline-flex flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${track} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            style={{
                backgroundColor: isChecked ? "var(--gogo-primary)" : "var(--gogo-grey-100)",
                borderColor: isChecked ? "var(--gogo-primary)" : "var(--gogo-divider)",
                ["--tw-ring-color" as any]: "var(--gogo-primary)",
            }}
        >
            <span
                className={`inline-block rounded-full bg-white shadow ring-0 transition-transform ${thumb} ${isChecked ? translateX : "translate-x-0.5"}`}
            />
        </button>
    );

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className={`inline-flex items-center gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${labelPlacement === "start" ? "flex-row-reverse justify-end" : ""}`}>
                {switchEl}
                {label && (
                    <span className="text-sm select-none" style={{ color: "var(--gogo-text-primary)" }}>{label}</span>
                )}
            </label>
            {helperText && (
                <p className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{helperText}</p>
            )}
        </div>
    );
}
