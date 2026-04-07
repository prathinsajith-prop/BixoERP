"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    showHome?: boolean;
    separator?: React.ReactNode;
    className?: string;
}

export function Breadcrumb({ items, showHome = false, separator, className = "" }: BreadcrumbProps) {
    const sep = separator ?? <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--gogo-text-secondary)" }} />;

    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex flex-wrap items-center gap-1 text-sm">
                {showHome && (
                    <>
                        <li>
                            <a href="/" className="inline-flex items-center transition-colors" style={{ color: "var(--gogo-text-secondary)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-primary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gogo-text-secondary)")}>
                                <Home className="w-4 h-4" />
                            </a>
                        </li>
                        {items.length > 0 && <li className="flex items-center">{sep}</li>}
                    </>
                )}
                {items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <React.Fragment key={idx}>
                            <li>
                                {isLast || !item.href ? (
                                    <span
                                        className="font-medium"
                                        style={{ color: isLast ? "var(--gogo-text-primary)" : "var(--gogo-text-secondary)" }}
                                        aria-current={isLast ? "page" : undefined}
                                    >
                                        {item.label}
                                    </span>
                                ) : (
                                    <a
                                        href={item.href}
                                        className="transition-colors"
                                        style={{ color: "var(--gogo-text-secondary)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-primary)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gogo-text-secondary)")}
                                    >
                                        {item.label}
                                    </a>
                                )}
                            </li>
                            {!isLast && <li className="flex items-center">{sep}</li>}
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
