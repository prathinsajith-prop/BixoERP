"use client";

import React from "react";

const GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-purple-500',
    'from-sky-500 to-blue-500',
];

function hashGradient(str: string): string {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function orgInitials(name: string): string {
    return (name || '?')
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

const SIZE_CLASSES: Record<string, string> = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-12 w-12 text-base',
    '2xl': 'h-14 w-14 text-lg',
};

export interface OrgAvatarProps {
    /** Organization name — used for initials and gradient colour */
    name: string;
    /** Pre-resolved image URL (blob URL or plain URL). Renders as <img> when provided. */
    src?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    /** Tailwind border-radius class, e.g. "rounded-lg", "rounded-xl", "rounded-2xl" */
    shape?: string;
    className?: string;
}

export function OrgAvatar({
    name,
    src,
    size = 'md',
    shape = 'rounded-xl',
    className = '',
}: OrgAvatarProps) {
    const sz = SIZE_CLASSES[size] ?? SIZE_CLASSES['md'];

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${sz} shrink-0 object-cover ${shape} ${className}`}
            />
        );
    }

    return (
        <div
            className={`flex ${sz} shrink-0 items-center justify-center ${shape} bg-gradient-to-br ${hashGradient(name)} font-bold text-white ${className}`}
        >
            {orgInitials(name)}
        </div>
    );
}
