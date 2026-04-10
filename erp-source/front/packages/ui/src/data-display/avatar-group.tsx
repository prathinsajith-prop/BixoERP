"use client";

import React from "react";
import { Avatar, AvatarProps } from "./avatar";

export interface AvatarGroupProps {
    avatars: AvatarProps[];
    max?: number;
    size?: AvatarProps["size"];
    className?: string;
}

export function AvatarGroup({ avatars, max = 5, size = "md", className = "" }: AvatarGroupProps) {
    const visible = avatars.slice(0, max);
    const overflow = avatars.length - max;

    const overlapMap = { xs: "-ml-1", sm: "-ml-2", md: "-ml-3", lg: "-ml-4", xl: "-ml-5", "2xl": "-ml-6" };
    const overlapClass = overlapMap[size ?? "md"];

    return (
        <div className={`flex items-center ${className}`} style={{ direction: "ltr" }}>
            {visible.map((avatar, idx) => (
                <span key={idx} className={`ring-2 ring-white rounded-full ${idx === 0 ? "" : overlapClass}`} style={{ zIndex: visible.length - idx }}>
                    <Avatar {...avatar} size={size} />
                </span>
            ))}
            {overflow > 0 && (
                <span
                    className={`inline-flex items-center justify-center rounded-full ring-2 ring-white text-xs font-medium ${overlapClass}`}
                    style={{ backgroundColor: "var(--gogo-grey-100)", color: "var(--gogo-text-secondary)", zIndex: 0, ...sizeStyleMap[size ?? "md"] }}
                >
                    +{overflow}
                </span>
            )}
        </div>
    );
}

const sizeStyleMap: Record<NonNullable<AvatarProps["size"]>, React.CSSProperties> = {
    xs: { width: 24, height: 24, fontSize: 10 },
    sm: { width: 32, height: 32, fontSize: 11 },
    md: { width: 40, height: 40, fontSize: 12 },
    lg: { width: 56, height: 56, fontSize: 14 },
    xl: { width: 64, height: 64, fontSize: 16 },
    "2xl": { width: 80, height: 80, fontSize: 18 },
};
