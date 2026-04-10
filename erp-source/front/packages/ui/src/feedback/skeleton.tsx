"use client";

import React from "react";

// ─── Primitive ────────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700/60 ${className}`}
        />
    );
}

// ─── Table list page skeleton ─────────────────────────────────────────────────
// Mirrors the standard admin list layout: bordered card, avatar + name/code,
// hidden secondary column (md), hidden tertiary column (lg), status pill, actions.
export interface TablePageSkeletonProps {
    rows?: number;
    // circular = Users page; rounded-lg = all other entity pages
    avatarShape?: "rounded-lg" | "full";
}

export function TablePageSkeleton({
    rows = 7,
    avatarShape = "rounded-lg",
}: TablePageSkeletonProps) {
    const avatarClass = avatarShape === "full" ? "rounded-full" : "rounded-lg";
    return (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
            {/* Header row */}
            <div className="flex items-center gap-4 border-b border-[var(--gogo-divider)] bg-gray-50/60 px-4 py-3 dark:bg-gray-800/40">
                <Skeleton className="h-3 w-28 flex-1 max-w-[7rem]" />
                <Skeleton className="hidden h-3 w-24 md:block" />
                <Skeleton className="hidden h-3 w-28 lg:block" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-16" />
            </div>
            {/* Body rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 border-b border-[var(--gogo-divider)] px-4 py-3.5 last:border-0"
                >
                    {/* Avatar + name/code */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Skeleton className={`h-8 w-8 shrink-0 ${avatarClass}`} />
                        <div className="space-y-1.5">
                            <Skeleton className={`h-3.5 w-${i % 2 === 0 ? "32" : "24"}`} />
                            <Skeleton className={`h-3 w-${i % 3 === 0 ? "16" : "20"}`} />
                        </div>
                    </div>
                    {/* Secondary col */}
                    <Skeleton className={`hidden h-3.5 w-${i % 2 === 0 ? "24" : "20"} md:block`} />
                    {/* Tertiary col */}
                    <Skeleton className={`hidden h-3 w-${i % 3 === 0 ? "40" : "32"} lg:block`} />
                    {/* Status pill */}
                    <Skeleton className="h-5 w-16 rounded-full" />
                    {/* Action buttons */}
                    <div className="flex shrink-0 gap-1">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Roles card-grid skeleton ─────────────────────────────────────────────────
// Mirrors the sm:grid-cols-2 lg:grid-cols-3 card grid on the roles page.
export interface RolesCardSkeletonProps {
    cards?: number;
}

export function RolesCardSkeleton({ cards = 6 }: RolesCardSkeletonProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cards }).map((_, i) => (
                <div
                    key={i}
                    className="overflow-hidden rounded-2xl bg-[var(--gogo-surface)] p-4 shadow-sm ring-1 ring-gray-100 sm:p-5 dark:ring-gray-800"
                >
                    {/* Header: icon + name/description + action buttons */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 shrink-0 rounded-xl sm:h-10 sm:w-10" />
                            <div className="space-y-1.5">
                                <Skeleton className={`h-3.5 w-${i % 2 === 0 ? "24" : "20"}`} />
                                <Skeleton className={`h-3 w-${i % 3 === 0 ? "32" : "28"}`} />
                            </div>
                        </div>
                        <div className="ml-2 flex gap-1">
                            <Skeleton className="h-7 w-7 rounded-lg" />
                            <Skeleton className="h-7 w-7 rounded-lg" />
                        </div>
                    </div>
                    {/* Footer: permission count + view link */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-10" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── User detail page skeleton ────────────────────────────────────────────────
// Mirrors admin/users/[userId]: banner card + avatar + name/email + tabs + content card.
export function UserDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* PageHeader */}
            <div className="space-y-1.5">
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-4 w-52" />
            </div>
            {/* Back button */}
            <Skeleton className="h-9 w-44 rounded-lg" />
            {/* Profile header card */}
            <div className="overflow-hidden rounded-2xl bg-[var(--gogo-surface)] shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                {/* Banner */}
                <Skeleton className="h-32 rounded-none" />
                <div className="relative px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
                        {/* Avatar overlapping banner */}
                        <div className="-mt-10 sm:-mt-12">
                            <Skeleton className="h-20 w-20 rounded-xl ring-4 ring-white dark:ring-gray-900 sm:h-24 sm:w-24" />
                        </div>
                        <div className="mt-4 flex-1 sm:mb-1 sm:mt-0">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-44" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-7 w-16 rounded-full" />
                                    <Skeleton className="h-7 w-20 rounded-full" />
                                    <Skeleton className="h-7 w-24 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Stats row */}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Skeleton className="h-11 w-24 rounded-xl" />
                        <Skeleton className="h-11 w-24 rounded-xl" />
                        <Skeleton className="h-11 w-28 rounded-xl" />
                    </div>
                </div>
            </div>
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-9 w-20 rounded-t-md" />
                <Skeleton className="h-9 w-16 rounded-t-md" />
                <Skeleton className="h-9 w-32 rounded-t-md" />
                <Skeleton className="h-9 w-16 rounded-t-md" />
            </div>
            {/* Content card */}
            <div className="rounded-2xl bg-[var(--gogo-surface)] p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                <div className="mb-5 flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-9 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Org Settings Tab skeleton ────────────────────────────────────────────────
// Mirrors the Settings tab inside admin/organizations/[orgId]: two SCard blocks
// (org info editable fields + optional advanced settings).
export function OrgSettingsTabSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2].map((ci) => (
                <div
                    key={ci}
                    className="overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]"
                >
                    <div className="flex items-start gap-3.5 border-b border-[var(--gogo-divider)] px-6 py-4">
                        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                        </div>
                    </div>
                    <div className="space-y-4 px-6 py-5">
                        {Array.from({ length: 3 }).map((_, fi) => (
                            <div key={fi} className="space-y-1.5">
                                <Skeleton className="h-3.5 w-20" />
                                <Skeleton className="h-9 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Org Settings page skeleton ───────────────────────────────────────────────
// Mirrors organization/page.tsx: breadcrumb + title + sticky sidebar + stacked section cards.
export function OrgSettingsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Breadcrumb + title */}
            <div>
                <Skeleton className="mb-2 h-3 w-36" />
                <Skeleton className="h-7 w-52" />
                <Skeleton className="mt-1.5 h-4 w-64" />
            </div>
            {/* Body: sidebar + content */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                {/* Sidebar — lg only */}
                <div className="hidden h-fit w-56 shrink-0 rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] p-3 lg:block">
                    <div className="space-y-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
                {/* Main content: 2 section cards */}
                <div className="flex-1 space-y-5">
                    {[1, 2].map((ci) => (
                        <div
                            key={ci}
                            className="overflow-hidden rounded-xl border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]"
                        >
                            <div className="flex items-start gap-3.5 border-b border-[var(--gogo-divider)] px-6 py-4">
                                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-44" />
                                    <Skeleton className="h-3 w-60" />
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {Array.from({ length: 4 }).map((_, fi) => (
                                        <div key={fi} className="space-y-1.5">
                                            <Skeleton className="h-3.5 w-24" />
                                            <Skeleton className="h-9 w-full rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-[var(--gogo-divider)] pt-5">
                                    <Skeleton className="h-3.5 w-48" />
                                    <Skeleton className="h-9 w-28 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Permissions grouped skeleton ─────────────────────────────────────────────
// Mirrors the resource-grouped card layout on the permissions page.
export interface PermissionsGroupSkeletonProps {
    groups?: number;
}

const PERM_ROWS_PER_GROUP = [4, 3, 5, 3];

export function PermissionsGroupSkeleton({
    groups = 3,
}: PermissionsGroupSkeletonProps) {
    return (
        <div className="space-y-4">
            {Array.from({ length: groups }).map((_, gi) => {
                const rowCount = PERM_ROWS_PER_GROUP[gi % PERM_ROWS_PER_GROUP.length];
                return (
                    <div
                        key={gi}
                        className="overflow-hidden rounded-2xl bg-[var(--gogo-surface)] shadow-sm ring-1 ring-gray-100 dark:ring-gray-800"
                    >
                        {/* Group header */}
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:px-5 dark:border-gray-800 dark:bg-gray-800/50">
                            <Skeleton className="h-7 w-7 shrink-0 rounded-lg sm:h-8 sm:w-8" />
                            <div className="space-y-1.5">
                                <Skeleton className={`h-3.5 w-${gi % 2 === 0 ? "20" : "28"}`} />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        {/* Permission rows */}
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {Array.from({ length: rowCount }).map((_, ri) => (
                                <div
                                    key={ri}
                                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                                        <Skeleton className={`h-6 w-${ri % 2 === 0 ? "20" : "24"} rounded-full`} />
                                        <Skeleton className={`hidden h-3 w-${ri % 3 === 0 ? "40" : "52"} sm:block`} />
                                    </div>
                                    <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
