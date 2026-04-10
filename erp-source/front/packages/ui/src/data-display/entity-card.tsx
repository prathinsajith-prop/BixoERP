'use client';

import React from 'react';
import { MoreVertical } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
export interface EntityCardField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface EntityCardProps {
  /** Initials or image src for the avatar */
  avatar?: string;
  avatarUrl?: string;
  /** Avatar background color (CSS value) */
  avatarColor?: string;
  /** Primary name */
  name: string;
  /** Subtitle line (e.g. job title) */
  subtitle?: string;
  /** Meta fields displayed as label: value pairs */
  fields?: EntityCardField[];
  /** Status badge node */
  badge?: React.ReactNode;
  onClick?: () => void;
  /** Kebab-menu actions */
  actions?: Array<{ label: string; onClick: () => void; danger?: boolean }>;
  className?: string;
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({
  initials,
  src,
  color,
  size = 'md',
}: {
  initials?: string;
  src?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-12 w-12 text-sm';
  if (src) {
    return (
      <img src={src} alt={initials} className={`${sizeClass} rounded-full object-cover ring-2`}
        style={{ '--tw-ring-color': 'var(--gogo-divider)' } as React.CSSProperties} />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ backgroundColor: color ?? 'var(--gogo-primary)' }}
    >
      {initials ?? '?'}
    </div>
  );
}

/* ─── ActionsMenu ────────────────────────────────────────── */
function ActionsMenu({ actions }: { actions: EntityCardProps['actions'] }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  if (!actions || actions.length === 0) return null;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="rounded-lg p-1.5 transition-colors hover:opacity-70"
        style={{ color: 'var(--gogo-text-secondary)' }}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-40 rounded-xl py-1 shadow-xl ring-1"
          style={{ backgroundColor: 'var(--gogo-surface)', borderColor: 'var(--gogo-divider)', boxShadow: 'var(--shadow-hover)' }}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={(e) => { e.stopPropagation(); a.onClick(); setOpen(false); }}
              className="flex w-full items-center px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{ color: a.danger ? '#ef4444' : 'var(--gogo-text-primary)' }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── EntityCard ─────────────────────────────────────────── */
export function EntityCard({
  avatar,
  avatarUrl,
  avatarColor,
  name,
  subtitle,
  fields = [],
  badge,
  onClick,
  actions,
  className = '',
}: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      className={`gogo-card group flex flex-col p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--gogo-surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        if (onClick) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = '';
      }}
    >
      {/* Header row: avatar + name + actions */}
      <div className="flex items-start gap-3">
        <Avatar initials={avatar} src={avatarUrl} color={avatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight" style={{ color: 'var(--gogo-text-primary)' }}>
            {name}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <ActionsMenu actions={actions} />
      </div>

      {/* Badge row */}
      {badge && <div className="mt-3">{badge}</div>}

      {/* Fields */}
      {fields.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: 'var(--gogo-divider)' }}>
          {fields.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--gogo-text-secondary)' }}>
                {f.label}
              </span>
              <span className="text-xs font-medium text-right" style={{ color: 'var(--gogo-text-primary)' }}>
                {f.value ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── EntityCardGrid ─────────────────────────────────────── */
export function EntityCardGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode;
  /** Tailwind grid column breakpoint preset */
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 4
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return <div className={`grid gap-4 ${colClass}`}>{children}</div>;
}
