"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "text-white hover:opacity-90 focus:ring-2 focus:ring-offset-2",
  secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 focus:ring-2 focus:ring-offset-2",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-2 focus:ring-offset-2",
  ghost: "bg-transparent hover:bg-gray-100 focus:ring-gray-500 focus:ring-2 dark:hover:bg-white/10",
  outline: "border bg-transparent hover:bg-gray-50 focus:ring-2 focus:ring-offset-2",
};

const variantInlineStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--gogo-primary)', color: '#fff' },
  secondary: {},
  danger: {},
  ghost: { color: 'var(--gogo-text-primary)' },
  outline: { borderColor: 'var(--gogo-divider)', color: 'var(--gogo-text-primary)' },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`gogo-btn inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ borderRadius: 'var(--radius-button)', fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-btn)', ...variantInlineStyles[variant] }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
