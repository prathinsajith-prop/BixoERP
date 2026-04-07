"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";

export interface TagsProps {
    name?: string;
    label?: string;
    value?: string[];
    onChange?: (value: string[]) => void;
    options?: string[];
    allowCustom?: boolean;
    maxTags?: number;
    delimiter?: string;
    placeholder?: string;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    helperText?: string;
    className?: string;
}

export function Tags({
    name,
    label,
    value = [],
    onChange,
    options = [],
    allowCustom = true,
    maxTags,
    delimiter = ",",
    placeholder = "Add tag...",
    readonly = false,
    disabled = false,
    required = false,
    error = false,
    helperText,
    className = "",
}: TagsProps) {
    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestions = options.filter(
        (opt) => opt.toLowerCase().includes(input.toLowerCase()) && !value.includes(opt)
    );

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (!trimmed || value.includes(trimmed)) return;
        if (maxTags && value.length >= maxTags) return;
        if (!allowCustom && !options.includes(trimmed)) return;
        onChange?.([...value, trimmed]);
        setInput("");
        setShowSuggestions(false);
    };

    const removeTag = (tag: string) => {
        onChange?.(value.filter((v) => v !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === delimiter) {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    const canAdd = !readonly && !disabled && (!maxTags || value.length < maxTags);

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="block text-sm font-medium" style={{ color: "var(--gogo-text-primary)" }}>
                    {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <div
                className={`flex flex-wrap gap-1.5 min-h-[2.5rem] px-3 py-2 rounded-md border focus-within:ring-2 transition-colors ${error ? "border-red-500" : ""} ${disabled || readonly ? "opacity-50 pointer-events-none" : "cursor-text"}`}
                style={{
                    borderColor: error ? undefined : "var(--gogo-divider)",
                    backgroundColor: "var(--gogo-surface)",
                    ["--tw-ring-color" as any]: "var(--gogo-primary)",
                }}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="gogo-chip inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: "var(--gogo-grey-100)", color: "var(--gogo-text-primary)", borderRadius: "var(--radius-chip)" }}
                    >
                        {tag}
                        {!readonly && !disabled && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                className="hover:opacity-70 focus:outline-none"
                                aria-label={`Remove ${tag}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
                {canAdd && (
                    <div className="relative flex-1 min-w-[80px]">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
                            onKeyDown={handleKeyDown}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder={value.length === 0 ? placeholder : ""}
                            className="w-full bg-transparent text-sm focus:outline-none"
                            style={{ color: "var(--gogo-text-primary)" }}
                            aria-label={label}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul
                                className="absolute top-full left-0 z-50 mt-1 w-48 py-1 rounded-md shadow-lg"
                                style={{ backgroundColor: "var(--gogo-surface)", border: "1px solid var(--gogo-divider)" }}
                            >
                                {suggestions.slice(0, 8).map((s) => (
                                    <li
                                        key={s}
                                        className="px-3 py-1.5 text-sm cursor-pointer transition-colors"
                                        style={{ color: "var(--gogo-text-primary)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--gogo-grey-100)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                                        onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                                    >
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            {name && <input type="hidden" name={name} value={value.join(delimiter)} required={required} />}
            {helperText && (
                <p className={`text-xs ${error ? "text-red-500" : ""}`} style={!error ? { color: "var(--gogo-text-secondary)" } : {}}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
