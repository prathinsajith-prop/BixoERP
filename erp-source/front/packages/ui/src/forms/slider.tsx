"use client";

import React from "react";

export interface SliderMark {
    value: number;
    label?: string;
}

export interface SliderProps {
    name?: string;
    label?: string;
    value?: number | [number, number];
    defaultValue?: number | [number, number];
    onChange?: (value: number | [number, number]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    helperText?: string;
    marks?: boolean | SliderMark[];
    showValue?: boolean;
    orientation?: "horizontal" | "vertical";
    fullWidth?: boolean;
    className?: string;
}

export function Slider({
    name,
    label,
    value,
    defaultValue,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    required = false,
    error = false,
    helperText,
    showValue = true,
    fullWidth = false,
    className = "",
}: SliderProps) {
    const isRange = Array.isArray(value ?? defaultValue);
    const initVal = value ?? defaultValue ?? (isRange ? [min, max] : min);
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(initVal);
    const current = isControlled ? value! : internal;

    const handleSingle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number(e.target.value);
        if (!isControlled) setInternal(v);
        onChange?.(v);
    };

    const handleRange = (idx: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const arr = Array.isArray(current) ? [...current] as [number, number] : [min, max] as [number, number];
        arr[idx] = Number(e.target.value);
        if (!isControlled) setInternal(arr);
        onChange?.(arr);
    };

    const trackStyle = {
        accentColor: "var(--gogo-primary)",
    };

    return (
        <div className={`flex flex-col gap-2 ${fullWidth ? "w-full" : ""} ${className}`}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium" style={{ color: "var(--gogo-text-primary)" }}>
                        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                    </label>
                    {showValue && !Array.isArray(current) && (
                        <span className="text-sm font-medium" style={{ color: "var(--gogo-primary)" }}>{current}</span>
                    )}
                </div>
            )}

            {Array.isArray(current) ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-8 text-center" style={{ color: "var(--gogo-text-secondary)" }}>{(current as [number, number])[0]}</span>
                        <input
                            type="range"
                            name={name}
                            min={min}
                            max={(current as [number, number])[1]}
                            step={step}
                            value={(current as [number, number])[0]}
                            disabled={disabled}
                            onChange={handleRange(0)}
                            className="flex-1 h-2 rounded-full cursor-pointer"
                            style={trackStyle}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-8 text-center" style={{ color: "var(--gogo-text-secondary)" }}>{(current as [number, number])[1]}</span>
                        <input
                            type="range"
                            min={(current as [number, number])[0]}
                            max={max}
                            step={step}
                            value={(current as [number, number])[1]}
                            disabled={disabled}
                            onChange={handleRange(1)}
                            className="flex-1 h-2 rounded-full cursor-pointer"
                            style={trackStyle}
                        />
                    </div>
                </div>
            ) : (
                <input
                    type="range"
                    name={name}
                    min={min}
                    max={max}
                    step={step}
                    value={current as number}
                    disabled={disabled}
                    required={required}
                    onChange={handleSingle}
                    className={`w-full h-2 rounded-full ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    style={trackStyle}
                    aria-invalid={error}
                />
            )}

            <div className="flex justify-between text-xs" style={{ color: "var(--gogo-text-secondary)" }}>
                <span>{min}</span><span>{max}</span>
            </div>

            {helperText && (
                <p className={`text-xs ${error ? "text-red-500" : ""}`} style={!error ? { color: "var(--gogo-text-secondary)" } : {}}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
