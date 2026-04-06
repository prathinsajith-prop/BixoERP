"use client";

import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} mx-4 max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: 'var(--gogo-surface)', borderRadius: 'var(--radius-modal)', boxShadow: 'var(--shadow-hover)' }}
      >
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--gogo-divider)' }}
        >
          <h2 className="text-lg font-semibold"
            style={{ color: 'var(--gogo-text-primary)', fontFamily: 'var(--font-gogo)' }}
          >{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--gogo-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gogo-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gogo-text-secondary)')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--gogo-divider)' }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
