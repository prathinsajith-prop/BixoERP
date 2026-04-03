'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
export type FilterType = 'text' | 'select' | 'multiselect' | 'date';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  quickOptions?: FilterOption[];
}

export type ActiveFilters = Record<string, string | string[]>;

export type ViewMode = 'table' | 'grid';

interface SearchFilterBarProps {
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Filter definitions */
  filters?: FilterConfig[];
  activeFilters?: ActiveFilters;
  onFilterChange?: (key: string, value: string | string[]) => void;
  onFilterClear?: (key: string) => void;
  onFilterClearAll?: () => void;
  /** View mode switcher */
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  showViewSwitcher?: boolean;
  /** Extra right-side actions (e.g. Add button) */
  actions?: React.ReactNode;
  className?: string;
}

/* ─── FilterDropdown ─────────────────────────────────────── */
function FilterDropdown({
  config,
  active,
  onApply,
  onClear,
}: {
  config: FilterConfig;
  active: string | string[] | undefined;
  onApply: (value: string | string[]) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<string | string[]>(() =>
    active ?? (config.type === 'multiselect' ? [] : '')
  );
  const ref = useRef<HTMLDivElement>(null);

  // Reset local on open
  const handleOpen = () => {
    setLocal(active ?? (config.type === 'multiselect' ? [] : ''));
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const hasValue = Array.isArray(active) ? active.length > 0 : Boolean(active);

  const toggleMulti = (val: string) => {
    setLocal((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    });
  };

  const apply = () => {
    onApply(local);
    setOpen(false);
  };

  const clear = () => {
    setLocal(config.type === 'multiselect' ? [] : '');
    onClear();
    setOpen(false);
  };

  const getLabel = () => {
    if (!hasValue) return config.label;
    if (config.type === 'multiselect') {
      const vals = active as string[];
      const labels = vals
        .map((v) => config.options?.find((o) => o.value === v)?.label ?? v)
        .join(', ');
      return `${config.label}: ${labels}`;
    }
    const label = config.options?.find((o) => o.value === active)?.label ?? String(active);
    return `${config.label}: ${label}`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all"
        style={
          hasValue
            ? {
                backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)',
                borderColor: 'var(--gogo-primary)',
                color: 'var(--gogo-primary)',
                fontWeight: 500,
              }
            : {
                backgroundColor: 'var(--gogo-surface)',
                borderColor: 'var(--gogo-divider)',
                color: 'var(--gogo-text-secondary)',
              }
        }
      >
        <span className="max-w-[160px] truncate">{getLabel()}</span>
        {hasValue ? (
          <span
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:opacity-70"
            style={{ backgroundColor: 'var(--gogo-primary)', color: '#fff' }}
          >
            <X className="h-2.5 w-2.5" />
          </span>
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl shadow-xl ring-1 overflow-hidden"
          style={{
            backgroundColor: 'var(--gogo-surface)',
            borderColor: 'var(--gogo-divider)',
            boxShadow: 'var(--shadow-hover)',
          }}
        >
          <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--gogo-divider)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gogo-text-secondary)' }}>
              Filter: {config.label}
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {/* Quick options */}
            {config.quickOptions && config.quickOptions.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--gogo-text-secondary)' }}>
                  Quick filters
                </p>
                <div className="flex flex-wrap gap-1 px-2 pb-2">
                  {config.quickOptions.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => { onApply(q.value); setOpen(false); }}
                      className="px-2 py-0.5 text-xs rounded-full border transition-all"
                      style={{ borderColor: 'var(--gogo-divider)', color: 'var(--gogo-text-secondary)' }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <hr style={{ borderColor: 'var(--gogo-divider)' }} />
              </div>
            )}

            {/* Type-specific filter content */}
            {(config.type === 'select' || config.type === 'multiselect') && config.options && (
              <div className="space-y-0.5">
                {config.options.map((opt) => {
                  const arr = Array.isArray(local) ? local : [local];
                  const checked = arr.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                      style={checked ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)' } : undefined}
                    >
                      <input
                        type={config.type === 'multiselect' ? 'checkbox' : 'radio'}
                        name={config.key}
                        checked={checked}
                        onChange={() =>
                          config.type === 'multiselect'
                            ? toggleMulti(opt.value)
                            : setLocal(opt.value)
                        }
                        className="accent-purple-600 h-3.5 w-3.5"
                      />
                      <span
                        className="text-sm"
                        style={{ color: checked ? 'var(--gogo-primary)' : 'var(--gogo-text-primary)', fontWeight: checked ? 500 : undefined }}
                      >
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {config.type === 'text' && (
              <input
                type="text"
                value={String(local)}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={config.placeholder ?? `Filter by ${config.label}...`}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: 'var(--gogo-divider)',
                  backgroundColor: 'var(--gogo-surface)',
                  color: 'var(--gogo-text-primary)',
                  borderRadius: 'var(--radius-input)',
                }}
                autoFocus
              />
            )}

            {config.type === 'date' && (
              <input
                type="date"
                value={String(local)}
                onChange={(e) => setLocal(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{
                  borderColor: 'var(--gogo-divider)',
                  backgroundColor: 'var(--gogo-surface)',
                  color: 'var(--gogo-text-primary)',
                  borderRadius: 'var(--radius-input)',
                }}
              />
            )}
          </div>

          <div className="flex gap-2 border-t px-3 py-2.5" style={{ borderColor: 'var(--gogo-divider)' }}>
            <button
              onClick={clear}
              className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--gogo-divider)', color: 'var(--gogo-text-secondary)' }}
            >
              Clear
            </button>
            <button
              onClick={apply}
              className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--gogo-primary)', borderRadius: 'var(--radius-button)' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SearchFilterBar ────────────────────────────────────── */
export function SearchFilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onFilterClear,
  onFilterClearAll,
  view = 'table',
  onViewChange,
  showViewSwitcher = true,
  actions,
  className = '',
}: SearchFilterBarProps) {
  const activeCount = Object.keys(activeFilters).filter((k) => {
    const v = activeFilters[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Search input */}
      <div className="relative min-w-[200px] flex-1 md:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: 'var(--gogo-text-secondary)' }}
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border focus:outline-none transition-colors"
          style={{
            borderRadius: 'var(--radius-input)',
            borderColor: 'var(--gogo-divider)',
            backgroundColor: 'var(--gogo-surface)',
            color: 'var(--gogo-text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--gogo-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--gogo-divider)')}
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange?.('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:opacity-70"
            style={{ color: 'var(--gogo-text-secondary)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: 'var(--gogo-text-secondary)' }} />
          {filters.map((f) => (
            <FilterDropdown
              key={f.key}
              config={f}
              active={activeFilters[f.key]}
              onApply={(val) => onFilterChange?.(f.key, val)}
              onClear={() => onFilterClear?.(f.key)}
            />
          ))}
          {activeCount > 0 && (
            <button
              onClick={onFilterClearAll}
              className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--gogo-primary)' }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* View switcher */}
      {showViewSwitcher && onViewChange && (
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--gogo-divider)' }}
        >
          <button
            onClick={() => onViewChange('table')}
            className="flex items-center justify-center px-2.5 py-1.5 transition-colors"
            title="Table view"
            style={
              view === 'table'
                ? { backgroundColor: 'var(--gogo-primary)', color: '#fff' }
                : { backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-secondary)' }
            }
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange('grid')}
            className="flex items-center justify-center px-2.5 py-1.5 transition-colors"
            title="Card view"
            style={
              view === 'grid'
                ? { backgroundColor: 'var(--gogo-primary)', color: '#fff' }
                : { backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-secondary)' }
            }
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Custom right actions */}
      {actions}
    </div>
  );
}

export default SearchFilterBar;
