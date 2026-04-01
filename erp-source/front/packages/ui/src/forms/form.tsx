"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`gogo-input block w-full px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
            : ""
        } ${className}`}
        style={!error ? { borderRadius: 'var(--radius-input)', border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-primary)' } : { borderRadius: 'var(--radius-input)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = "", id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`gogo-input block w-full px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
            : ""
        } ${className}`}
        style={!error ? { borderRadius: 'var(--radius-input)', border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-primary)' } : { borderRadius: 'var(--radius-input)' }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`gogo-input block w-full px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
            : ""
        } ${className}`}
        style={!error ? { borderRadius: 'var(--radius-input)', border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-primary)' } : { borderRadius: 'var(--radius-input)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
