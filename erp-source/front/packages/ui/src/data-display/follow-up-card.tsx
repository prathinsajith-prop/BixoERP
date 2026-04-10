"use client";

import React from "react";
import { Calendar, Tag, User } from "lucide-react";
import { Chip } from "./chip";

export interface FollowUpItem {
    id?: string | number;
    title: string;
    dateDay?: string;
    dateMonth?: string;
    dateFormatted?: string;
    type?: string;
    typeLabel?: string;
    typeColor?: string;
    status?: string;
    statusColor?: string;
    assignee?: string;
    description?: string;
}

export interface FollowUpCardProps {
    title?: string;
    items?: FollowUpItem[];
    onItemClick?: (item: FollowUpItem) => void;
    className?: string;
}

export function FollowUpCard({ title = "Follow-ups", items = [], onItemClick, className = "" }: FollowUpCardProps) {
    return (
        <div
            className={`rounded-lg overflow-hidden ${className}`}
            style={{ backgroundColor: "var(--gogo-surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-card)" }}
        >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--gogo-divider)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--gogo-text-primary)", fontFamily: "var(--font-gogo)" }}>{title}</h3>
            </div>
            {items.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <p className="text-sm" style={{ color: "var(--gogo-text-secondary)" }}>No follow-ups scheduled</p>
                </div>
            ) : (
                <ul className="divide-y" style={{ borderColor: "var(--gogo-divider)" }}>
                    {items.map((item, idx) => (
                        <li
                            key={item.id ?? idx}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors ${onItemClick ? "cursor-pointer" : ""}`}
                            onClick={() => onItemClick?.(item)}
                            onMouseEnter={(e) => onItemClick && (e.currentTarget.style.backgroundColor = "var(--gogo-grey-100)")}
                            onMouseLeave={(e) => onItemClick && (e.currentTarget.style.backgroundColor = "")}
                        >
                            {(item.dateDay || item.dateMonth) && (
                                <div
                                    className="flex-shrink-0 w-10 rounded text-center py-1"
                                    style={{ backgroundColor: "var(--gogo-grey-100)" }}
                                >
                                    {item.dateDay && <p className="text-base font-bold leading-none" style={{ color: "var(--gogo-primary)" }}>{item.dateDay}</p>}
                                    {item.dateMonth && <p className="text-xs uppercase" style={{ color: "var(--gogo-text-secondary)" }}>{item.dateMonth}</p>}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--gogo-text-primary)" }}>{item.title}</p>
                                {item.description && (
                                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--gogo-text-secondary)" }}>{item.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {item.typeLabel && (
                                        <Chip label={item.typeLabel} size="small" variant="outlined" color="primary" />
                                    )}
                                    {item.status && (
                                        <Chip label={item.status} size="small" variant="filled" color="default" />
                                    )}
                                    {item.assignee && (
                                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--gogo-text-secondary)" }}>
                                            <User className="w-3 h-3" />{item.assignee}
                                        </span>
                                    )}
                                    {item.dateFormatted && !item.dateDay && (
                                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--gogo-text-secondary)" }}>
                                            <Calendar className="w-3 h-3" />{item.dateFormatted}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
