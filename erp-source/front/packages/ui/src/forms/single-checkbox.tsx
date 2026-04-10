"use client";

import React from "react";

export interface SingleCheckboxProps {
    name?: string;
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    helperText?: string;
    size?: "small" | "medium" | "large";
    className?: string;
}

const sizeClasses = { small: "h-3.5 w-3.5", medium: "h-4 w-4", large: "h-5 w-5" };

export function SingleCheckbox({
    name,
    label,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    required = false,
    error = false,
    helperText,
    size = "medium",
    className = "",
}: SingleCheckboxProps) {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const isChecked = isControlled ? checked : internal;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) setInternal(e.target.checked);
        onChange?.(e.target.checked);
    };

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className={`inline-flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <input
                    type="checkbox"
                    name={name}
                    checked={isChecked}
                    disabled={disabled}
                    required={required}
                    onChange={handleChange}
                    className={`${sizeClasses[size]} rounded focus:outline-none`}
                    style={{ accentColor: "var(--gogo-primary)", cursor: disabled ? "not-allowed" : "pointer" }}
                    aria-invalid={error}
                />
                {label && (
                    <span className="text-sm" style={{ color: "var(--gogo-text-primary)" }}>
                        {label}
                        {required && <span className="ml-0.5 text-red-500">*</span>}
                    </span>
                )}
            </label>
            {helperText && (
                <p className={`text-xs ${error ? "text-red-500" : ""}`} style={!error ? { color: "var(--gogo-text-secondary)" } : {}}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
