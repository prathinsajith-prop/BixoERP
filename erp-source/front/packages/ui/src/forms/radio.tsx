"use client";

import React from "react";

export interface RadioOption {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
}

export interface RadioProps {
    name: string;
    label?: string;
    value?: string;
    options?: Record<string, string> | RadioOption[];
    onChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    direction?: "horizontal" | "vertical";
    className?: string;
}

function normalizeOptions(options: Record<string, string> | RadioOption[]): RadioOption[] {
    if (Array.isArray(options)) return options;
    return Object.entries(options).map(([value, label]) => ({ value, label }));
}

export function Radio({
    name,
    label,
    value,
    options = [],
    onChange,
    required = false,
    disabled = false,
    error = false,
    helperText,
    direction = "vertical",
    className = "",
}: RadioProps) {
    const normalized = normalizeOptions(options);

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
                        className={`inline-flex items-start gap-2 cursor-pointer ${option.disabled || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            disabled={option.disabled || disabled}
                            required={required}
                            onChange={() => onChange?.(option.value)}
                            className="mt-0.5 h-4 w-4 cursor-pointer focus:outline-none"
                            style={{ accentColor: "var(--gogo-primary)" }}
                        />
                        <span className="flex flex-col">
                            <span className="text-sm" style={{ color: "var(--gogo-text-primary)" }}>{option.label}</span>
                            {option.description && (
                                <span className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{option.description}</span>
                            )}
                        </span>
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
