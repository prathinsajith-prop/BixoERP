"use client";

import React from "react";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2" | "caption" | "overline";
type TextWeight = "thin" | "extralight" | "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
type TextAlign = "left" | "center" | "right" | "justify";
type TextColor = "primary" | "secondary" | "disabled" | "error" | "warning" | "success" | "info" | "inherit";

export interface TextProps {
    variant?: TextVariant;
    weight?: TextWeight;
    align?: TextAlign;
    color?: TextColor;
    noWrap?: boolean;
    gutterBottom?: boolean;
    paragraph?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    as?: React.ElementType;
}

const variantTagMap: Record<TextVariant, React.ElementType> = {
    h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", h6: "h6",
    subtitle1: "h6", subtitle2: "h6",
    body1: "p", body2: "p",
    caption: "span", overline: "span",
};

const variantClasses: Record<TextVariant, string> = {
    h1: "text-4xl font-bold", h2: "text-3xl font-bold", h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold", h5: "text-lg font-medium", h6: "text-base font-medium",
    subtitle1: "text-base font-medium", subtitle2: "text-sm font-medium",
    body1: "text-base", body2: "text-sm",
    caption: "text-xs", overline: "text-xs uppercase tracking-widest",
};

const weightClasses: Record<TextWeight, string> = {
    thin: "font-thin", extralight: "font-extralight", light: "font-light",
    normal: "font-normal", medium: "font-medium", semibold: "font-semibold",
    bold: "font-bold", extrabold: "font-extrabold",
};

const alignClasses: Record<TextAlign, string> = {
    left: "text-left", center: "text-center", right: "text-right", justify: "text-justify",
};

const colorVarMap: Record<TextColor, string> = {
    primary: "var(--gogo-text-primary)",
    secondary: "var(--gogo-text-secondary)",
    disabled: "var(--gogo-text-secondary)",
    error: "#ef4444",
    warning: "#f59e0b",
    success: "#22c55e",
    info: "#0ea5e9",
    inherit: "inherit",
};

export function Text({
    variant = "body1",
    weight,
    align,
    color = "primary",
    noWrap = false,
    gutterBottom = false,
    paragraph = false,
    className = "",
    style,
    children,
    as,
}: TextProps) {
    const Component: React.ElementType = as ?? (paragraph ? "p" : variantTagMap[variant]);
    return (
        <Component
            className={[
                variantClasses[variant],
                weight ? weightClasses[weight] : "",
                align ? alignClasses[align] : "",
                noWrap ? "truncate" : "",
                gutterBottom ? "mb-2" : "",
                className,
            ].filter(Boolean).join(" ")}
            style={{ color: colorVarMap[color], fontFamily: "var(--font-gogo)", ...style }}
        >
            {children}
        </Component>
    );
}

// Typography is an alias for Text
export { Text as Typography };
