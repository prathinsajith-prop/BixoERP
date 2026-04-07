"use client";

import React from "react";
import { Drawer } from "./drawer";
import { Loader2 } from "lucide-react";

export interface FullDetailsDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    headerExtra?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    loading?: boolean;
    size?: "lg" | "xl" | "full";
}

export function FullDetailsDrawer({
    open,
    onClose,
    title,
    subtitle,
    headerExtra,
    children,
    footer,
    loading = false,
    size = "xl",
}: FullDetailsDrawerProps) {
    return (
        <Drawer
            open={open}
            onClose={onClose}
            anchor="right"
            size={size}
            footer={footer}
        >
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>{title}</h2>
                    {subtitle && <p className="text-sm mt-1" style={{ color: "var(--gogo-text-secondary)" }}>{subtitle}</p>}
                    {headerExtra && <div className="mt-3">{headerExtra}</div>}
                </div>
                <div className="h-px" style={{ backgroundColor: "var(--gogo-divider)" }} />
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--gogo-primary)" }} />
                    </div>
                ) : (
                    children
                )}
            </div>
        </Drawer>
    );
}
