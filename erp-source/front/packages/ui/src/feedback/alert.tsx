'use client';

import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

const VARIANT_STYLES: Record<AlertVariant, { border: string; bg: string; icon: string; titleColor: string; textColor: string }> = {
    info: {
        border: '#93c5fd',
        bg: 'rgba(219,234,254,0.6)',
        icon: 'var(--gogo-primary)',
        titleColor: '#1d4ed8',
        textColor: '#1e40af',
    },
    success: {
        border: '#6ee7b7',
        bg: 'rgba(209,250,229,0.6)',
        icon: '#059669',
        titleColor: '#065f46',
        textColor: '#047857',
    },
    warning: {
        border: '#fcd34d',
        bg: 'rgba(254,243,199,0.6)',
        icon: '#d97706',
        titleColor: '#92400e',
        textColor: '#b45309',
    },
    error: {
        border: '#fca5a5',
        bg: 'rgba(254,226,226,0.6)',
        icon: '#dc2626',
        titleColor: '#991b1b',
        textColor: '#b91c1c',
    },
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
    if (variant === 'success') {
        return (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }
    if (variant === 'warning') {
        return (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        );
    }
    if (variant === 'error') {
        return (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }
    // info
    return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
    );
}

export function Alert({ variant = 'info', title, children, onClose, className = '' }: AlertProps) {
    const s = VARIANT_STYLES[variant];
    return (
        <div
            className={`flex gap-3 rounded-xl p-4 ${className}`}
            style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}
            role="alert"
        >
            <span style={{ color: s.icon }}><AlertIcon variant={variant} /></span>
            <div className="flex-1 min-w-0">
                {title && (
                    <p className="text-sm font-semibold" style={{ color: s.titleColor }}>{title}</p>
                )}
                <div className="text-sm" style={{ color: s.textColor, marginTop: title ? '0.125rem' : 0 }}>
                    {children}
                </div>
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded p-0.5 transition"
                    style={{ color: s.icon }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    aria-label="Dismiss"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
