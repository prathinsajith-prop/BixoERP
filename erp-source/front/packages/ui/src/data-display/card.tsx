"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`gogo-card ${padding ? "p-6" : ""} ${className}`}
      style={{ backgroundColor: 'var(--gogo-surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-card)')}
    >
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
        <h3 className="font-semibold" style={{ fontSize: 'var(--font-size-h6)', fontWeight: 'var(--font-weight-h6)', color: 'var(--gogo-text-primary)' }}>{title}</h3>
        {description && <p className="text-sm mt-0.5" style={{ color: 'var(--gogo-text-secondary)' }}>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
