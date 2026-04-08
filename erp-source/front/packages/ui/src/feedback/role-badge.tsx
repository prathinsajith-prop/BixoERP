"use client";

import React from "react";

const ROLE_COLORS: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    MANAGER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    MEMBER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export interface RoleBadgeProps {
    role: string;
    className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
    const key = (role || 'MEMBER').toUpperCase();
    const colorClass = ROLE_COLORS[key] ?? ROLE_COLORS['MEMBER'];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass} ${className}`}
        >
            {role}
        </span>
    );
}
