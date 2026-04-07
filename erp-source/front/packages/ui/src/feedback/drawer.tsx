"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

type DrawerAnchor = "left" | "right" | "top" | "bottom";
type DrawerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    anchor?: DrawerAnchor;
    size?: DrawerSize;
    hideCloseButton?: boolean;
    className?: string;
}

const sizeSideMap: Record<DrawerSize, string> = {
    sm: "w-72",
    md: "w-96",
    lg: "w-[32rem]",
    xl: "w-[48rem]",
    full: "w-screen",
};

const sizeVertMap: Record<DrawerSize, string> = {
    sm: "h-1/3",
    md: "h-1/2",
    lg: "h-2/3",
    xl: "h-3/4",
    full: "h-screen",
};

const anchorClasses: Record<DrawerAnchor, { panel: string; enter: string; leave: string }> = {
    right: { panel: "right-0 top-0 h-full", enter: "translate-x-0", leave: "translate-x-full" },
    left: { panel: "left-0 top-0 h-full", enter: "translate-x-0", leave: "-translate-x-full" },
    top: { panel: "top-0 left-0 w-full", enter: "translate-y-0", leave: "-translate-y-full" },
    bottom: { panel: "bottom-0 left-0 w-full", enter: "translate-y-0", leave: "translate-y-full" },
};

export function Drawer({ open, onClose, title, children, footer, anchor = "right", size = "md", hideCloseButton = false, className = "" }: DrawerProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = ""; };
        }
    }, [open]);

    const { panel, enter, leave } = anchorClasses[anchor];
    const isSide = anchor === "left" || anchor === "right";
    const sizeClass = isSide ? sizeSideMap[size] : sizeVertMap[size];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`fixed z-50 flex flex-col transition-transform duration-300 ${panel} ${sizeClass} ${open ? enter : leave} ${className}`}
                style={{ backgroundColor: "var(--gogo-surface)", boxShadow: "var(--shadow-hover)" }}
            >
                {(title || !hideCloseButton) && (
                    <div
                        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                        style={{ borderBottom: "1px solid var(--gogo-divider)" }}
                    >
                        {title && (
                            <h2 className="text-base font-semibold" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>
                                {title}
                            </h2>
                        )}
                        {!hideCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="ml-auto rounded-full p-1 transition-colors"
                                style={{ color: "var(--gogo-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-text-primary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gogo-text-secondary)")}
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && (
                    <div
                        className="flex-shrink-0 px-5 py-4 flex justify-end gap-3"
                        style={{ borderTop: "1px solid var(--gogo-divider)" }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
}
