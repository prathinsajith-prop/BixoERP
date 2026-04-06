"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div className={`gogo-card ${padding ? "p-6" : ""} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-[length:var(--font-size-h6)] font-semibold text-[var(--gogo-text-primary)]">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-[var(--gogo-text-secondary)]">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
