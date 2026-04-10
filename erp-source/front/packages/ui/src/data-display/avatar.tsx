"use client";

import React, { useState } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type AvatarShape = "circular" | "rounded" | "square";
type AvatarStatus = "online" | "offline" | "away" | "busy";

export interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: AvatarSize;
    shape?: AvatarShape;
    status?: AvatarStatus;
    className?: string;
    onClick?: () => void;
}

const sizeClasses: Record<AvatarSize, string> = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-20 h-20 text-xl",
};

const shapeClasses: Record<AvatarShape, string> = {
    circular: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
};

const statusClasses: Record<AvatarStatus, string> = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
};

function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
        color += `00${((hash >> (i * 8)) & 0xff).toString(16)}`.slice(-2);
    }
    return color;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
    src,
    alt,
    name,
    size = "md",
    shape = "circular",
    status,
    className = "",
    onClick,
}: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;
    const showInitials = !showImage && name;
    const bgColor = name ? stringToColor(name) : "var(--gogo-grey-100)";

    return (
        <span className="relative inline-flex flex-shrink-0">
            <span
                className={`inline-flex items-center justify-center overflow-hidden font-medium select-none ${sizeClasses[size]} ${shapeClasses[shape]} ${onClick ? "cursor-pointer" : ""} ${className}`}
                style={showInitials ? { backgroundColor: bgColor, color: "#fff" } : { backgroundColor: "var(--gogo-grey-100)" }}
                onClick={onClick}
                role={onClick ? "button" : undefined}
                tabIndex={onClick ? 0 : undefined}
            >
                {showImage ? (
                    <img
                        src={src}
                        alt={alt || name || "avatar"}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : showInitials ? (
                    getInitials(name!)
                ) : (
                    <svg className="w-3/5 h-3/5" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--gogo-text-secondary)" }}>
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                )}
            </span>
            {status && (
                <span
                    className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${statusClasses[status]}`}
                    style={{ width: "25%", height: "25%", minWidth: 8, minHeight: 8 }}
                />
            )}
        </span>
    );
}
