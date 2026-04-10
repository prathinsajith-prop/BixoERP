"use client";

import React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className = "", required, children, ...props }, ref) => (
        <label
            ref={ref}
            className={`block text-sm font-medium ${className}`}
            style={{ color: "var(--gogo-text-primary)" }}
            {...props}
        >
            {children}
            {required && (
                <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            )}
        </label>
    )
);

Label.displayName = "Label";
