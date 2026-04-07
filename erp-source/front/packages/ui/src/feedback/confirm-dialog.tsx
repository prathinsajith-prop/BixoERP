"use client";

import React from "react";

type ConfirmVariant = "default" | "danger" | "warning" | "success" | "info";

export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
}

const variantConfirmClass: Record<ConfirmVariant, string> = {
    default: "gogo-btn-primary shadow-[var(--shadow-card)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600",
    success: "bg-green-600 text-white hover:bg-green-700",
    info: "bg-sky-500 text-white hover:bg-sky-600",
};

const variantIcon: Record<ConfirmVariant, React.ReactNode> = {
    default: null,
    danger: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.193 2.5 1.732 2.5z" />
            </svg>
        </div>
    ),
    warning: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.193 2.5 1.732 2.5z" />
            </svg>
        </div>
    ),
    success: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
    ),
    info: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 mb-4">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
        </div>
    ),
};

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = "Confirm",
    message = "Are you sure you want to proceed?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={!loading ? onClose : undefined} />
            <div
                className="relative z-10 w-full max-w-md mx-4 p-6 text-center"
                style={{ backgroundColor: "var(--gogo-surface)", borderRadius: "var(--radius-modal)", boxShadow: "var(--shadow-hover)" }}
            >
                {variantIcon[variant]}
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>
                    {title}
                </h2>
                {message && (
                    <p className="text-sm mb-6" style={{ color: "var(--gogo-text-secondary)" }}>{message}</p>
                )}
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        className="gogo-btn px-4 py-2 text-sm font-medium border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] hover:bg-[var(--gogo-grey-100)] transition-colors disabled:opacity-50"
                        style={{ borderRadius: "var(--radius-btn)", color: "var(--gogo-text-primary)" }}
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`gogo-btn px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variantConfirmClass[variant]}`}
                        style={{ borderRadius: "var(--radius-btn)" }}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {confirmLabel}
                            </span>
                        ) : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
