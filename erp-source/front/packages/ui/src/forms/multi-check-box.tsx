"use client";

import React from "react";

export interface CheckboxOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface MultiCheckBoxProps {
    name?: string;
    label?: string;
    value?: string[];
    options?: Record<string, string> | CheckboxOption[];
    onChange?: (value: string[]) => void;
    required?: boolean;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    direction?: "horizontal" | "vertical";
    className?: string;
}

function normalizeOptions(options: Record<string, string> | CheckboxOption[]): CheckboxOption[] {
    if (Array.isArray(options)) return options;
    return Object.entries(options).map(([value, label]) => ({ value, label }));
}

export function MultiCheckBox({
    name,
    label,
    value = [],
    options = [],
    onChange,
    required = false,
    disabled = false,
    error = false,
    helperText,
    direction = "vertical",
    className = "",
}: MultiCheckBoxProps) {
    const normalized = normalizeOptions(options);

    const toggle = (optValue: string) => {
        const next = value.includes(optValue)
            ? value.filter((v) => v !== optValue)
            : [...value, optValue];
        onChange?.(next);
    };

    return (
        <fieldset className={`space-y-1 ${className}`} disabled={disabled}>
            {label && (
                <legend className="block text-sm font-medium mb-2" style={{ color: "var(--gogo-text-primary)" }}>
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </legend>
            )}
            <div className={`flex ${direction === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-2"}`}>
                {normalized.map((option) => (
                    <label
                        key={option.value}
                        className={`inline-flex items-center gap-2 ${option.disabled || disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        <input
                            type="checkbox"
                            name={name}
                            value={option.value}
                            checked={value.includes(option.value)}
                            disabled={option.disabled || disabled}
                            onChange={() => toggle(option.value)}
                            className="h-4 w-4 rounded focus:outline-none"
                            style={{ accentColor: "var(--gogo-primary)" }}
                        />
                        <span className="text-sm" style={{ color: "var(--gogo-text-primary)" }}>{option.label}</span>
                    </label>
                ))}
            </div>
            {helperText && (
                <p className={`text-xs mt-1 ${error ? "text-red-500" : ""}`} style={!error ? { color: "var(--gogo-text-secondary)" } : {}}>
                    {helperText}
                </p>
            )}
        </fieldset>
    );
}
