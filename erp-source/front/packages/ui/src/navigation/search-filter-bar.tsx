'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, Search, SlidersHorizontal, X } from 'lucide-react';

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
export type ActiveOperators = Record<string, string>;

export type ViewMode = 'table' | 'grid' | 'list';

export interface ViewOption {
  value: ViewMode;
  label: string;
}

interface SearchHistoryEntry {
  id: string;
  searchText: string;
  filters: ActiveFilters;
  operators?: ActiveOperators;
  label: string;
  timestamp: number;
}

interface SearchFilterBarProps {
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Filter definitions */
  filters?: FilterConfig[];
  activeFilters?: ActiveFilters;
  activeOperators?: ActiveOperators;
  onFilterChange?: (key: string, value: string | string[]) => void;
  onFilterStateChange?: (key: string, state: { value: string | string[]; operator: string }) => void;
  onFilterClear?: (key: string) => void;
  onFilterClearAll?: () => void;
  /** View mode switcher */
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  showViewSwitcher?: boolean;
  viewOptions?: ViewOption[];
  /** Extra right-side actions (e.g. Add button) */
  actions?: React.ReactNode;
  className?: string;
  storageKey?: string;
  onSearch?: () => void;
}

function formatFilterSummary(config: FilterConfig, value: string | string[]) {
  if (Array.isArray(value)) {
    const labels = value
      .map((item) => config.options?.find((option) => option.value === item)?.label ?? item)
      .join(", ");
    return `${config.label}: ${labels}`;
  }
  const label = config.options?.find((option) => option.value === value)?.label ?? value;
  return `${config.label}: ${label}`;
}

function getDefaultOperator(type: FilterType) {
  if (type === 'multiselect') return 'in';
  if (type === 'date') return 'on';
  if (type === 'text') return 'contains';
  return 'is';
}

function getOperatorOptions(type: FilterType) {
  if (type === 'multiselect') {
    return [
      { value: 'in', label: 'In', multi: true },
      { value: 'not_in', label: 'Not in', multi: true },
    ];
  }

  if (type === 'date') {
    return [
      { value: 'on', label: 'On' },
      { value: 'before', label: 'Before' },
      { value: 'after', label: 'After' },
      { value: 'between', label: 'Between', multi: true },
    ];
  }

  if (type === 'text') {
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'starts_with', label: 'Starts with' },
    ];
  }

  return [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
  ];
}

function formatFilterValue(config: FilterConfig, value: string | string[] | undefined, operator?: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) return config.placeholder ?? `Select ${config.label}`;

  if (Array.isArray(value)) {
    const labels = value.map((item) => config.options?.find((option) => option.value === item)?.label ?? item);
    return labels.join(', ');
  }

  if (config.type === 'date') {
    return String(value);
  }

  const resolved = config.options?.find((option) => option.value === value)?.label ?? value;

  if (!operator || operator === getDefaultOperator(config.type)) return resolved;
  const operatorLabel = getOperatorOptions(config.type).find((entry) => entry.value === operator)?.label ?? operator;
  return `${operatorLabel}: ${resolved}`;
}

function formatTimeAgo(timestamp: number) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return `${diffSeconds || 1}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/* ─── SearchFilterBar ────────────────────────────────────── */
export function SearchFilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  activeFilters = {},
  activeOperators = {},
  onFilterChange,
  onFilterStateChange,
  onFilterClear,
  onFilterClearAll,
  actions,
  className = '',
  storageKey = 'searchHistory.searchFilterBar',
  onSearch,
}: SearchFilterBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverMode, setPopoverMode] = useState<'history' | 'advanced-list' | 'advanced-detail'>('history');
  const [draftFilters, setDraftFilters] = useState<ActiveFilters>(activeFilters);
  const [draftOperators, setDraftOperators] = useState<ActiveOperators>(activeOperators);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [expandedFilterKey, setExpandedFilterKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCount = Object.keys(activeFilters).filter((k) => {
    const v = activeFilters[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;

  const quickFilterActions = useMemo(
    () => filters.flatMap((filter) =>
      (filter.quickOptions ?? []).map((option) => ({
        id: `${filter.key}:${option.value}`,
        label: `${filter.label}: ${option.label}`,
        apply: () => ({
          filters: { ...activeFilters, [filter.key]: option.value },
          operators: { ...activeOperators, [filter.key]: getDefaultOperator(filter.type) },
        }),
      }))
    ),
    [filters, activeFilters, activeOperators]
  );

  const activeFilterEntries = useMemo(
    () => filters.flatMap((filter) => {
      const value = activeFilters[filter.key];
      if (!value || (Array.isArray(value) && value.length === 0)) return [];
      return [{ key: filter.key, label: formatFilterSummary(filter, value), valueLabel: formatFilterValue(filter, value, activeOperators[filter.key]) }];
    }),
    [activeFilters, filters, activeOperators]
  );

  useEffect(() => {
    setDraftFilters(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    setDraftOperators(activeOperators);
  }, [activeOperators]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as SearchHistoryEntry[];
      if (Array.isArray(parsed)) setSearchHistory(parsed);
    } catch {
      setSearchHistory([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!popoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedSearch = containerRef.current?.contains(target);

      if (!clickedSearch) {
        setPopoverOpen(false);
        setPopoverMode('history');
        setExpandedFilterKey(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const persistHistory = (entries: SearchHistoryEntry[]) => {
    setSearchHistory(entries);
    localStorage.setItem(storageKey, JSON.stringify(entries));
  };

  const removeHistoryEntry = (id: string) => {
    persistHistory(searchHistory.filter((entry) => entry.id !== id));
  };

  const commitSearchHistory = () => {
    const hasSearch = searchValue.trim().length > 0;
    const hasFilters = activeCount > 0;
    if (!hasSearch && !hasFilters) return;

    const label = hasSearch
      ? searchValue.trim()
      : activeFilterEntries.map((entry) => entry.label).join(', ');
    const latest: SearchHistoryEntry = {
      id: `${Date.now()}`,
      searchText: searchValue,
      filters: activeFilters,
      operators: activeOperators,
      label,
      timestamp: Date.now(),
    };

    const previous = searchHistory[0];
    if (previous && previous.searchText === latest.searchText && JSON.stringify(previous.filters) === JSON.stringify(latest.filters)) {
      return;
    }

    persistHistory([latest, ...searchHistory].slice(0, 8));
  };

  const applyFilters = (nextFilters: ActiveFilters, nextOperators: ActiveOperators) => {
    onFilterClearAll?.();
    filters.forEach((filter) => {
      const value = nextFilters[filter.key];
      if (!value) return;
      if (Array.isArray(value) && value.length === 0) return;
      const operator = nextOperators[filter.key] ?? getDefaultOperator(filter.type);
      onFilterStateChange?.(filter.key, { value, operator });
      onFilterChange?.(filter.key, value);
    });
  };

  const handleQuickFilter = (nextState: { filters: ActiveFilters; operators: ActiveOperators }) => {
    applyFilters(nextState.filters, nextState.operators);
    setPopoverOpen(false);
    setPopoverMode('history');
    setExpandedFilterKey(null);
    onSearch?.();
  };

  const handleRestoreHistory = (entry: SearchHistoryEntry) => {
    onSearchChange?.(entry.searchText);
    applyFilters(entry.filters, entry.operators ?? {});
    setPopoverOpen(false);
    setPopoverMode('history');
    setExpandedFilterKey(null);
    onSearch?.();
  };

  const handleApplyDraftFilters = () => {
    applyFilters(draftFilters, draftOperators);
    commitSearchHistory();
    setPopoverOpen(false);
    setPopoverMode('history');
    setExpandedFilterKey(null);
    onSearch?.();
  };

  const handleSearchSubmit = () => {
    commitSearchHistory();
    onSearch?.();
    setPopoverOpen(false);
    setPopoverMode('history');
    setExpandedFilterKey(null);
  };

  const visibleInlineFilters = searchValue.trim().length === 0 ? activeFilterEntries.slice(0, 2) : [];
  const hiddenInlineFilterCount = Math.max(0, activeFilterEntries.length - visibleInlineFilters.length);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  const renderFilterEditor = (filter: FilterConfig) => {
    const value = draftFilters[filter.key] ?? (filter.type === 'multiselect' ? [] : '');
    const operator = draftOperators[filter.key] ?? getDefaultOperator(filter.type);
    const operatorOptions = getOperatorOptions(filter.type);
    const isMultiOperator = operatorOptions.find((entry) => entry.value === operator)?.multi === true;

    const setOperator = (nextOperator: string) => {
      const nextOption = operatorOptions.find((entry) => entry.value === nextOperator);
      setDraftOperators((prev) => ({ ...prev, [filter.key]: nextOperator }));

      if (filter.type === 'multiselect' || nextOption?.multi) {
        const nextValue = Array.isArray(value) ? value : value ? [value] : [];
        setDraftFilters((prev) => ({ ...prev, [filter.key]: nextValue }));
        return;
      }

      if (Array.isArray(value)) {
        setDraftFilters((prev) => ({ ...prev, [filter.key]: value[0] ?? '' }));
      }
    };

    const renderValueControl = () => {
      if (filter.type === 'text') {
        return (
          <input
            type="text"
            value={String(Array.isArray(value) ? value[0] ?? '' : value)}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, [filter.key]: event.target.value }))}
            placeholder={filter.placeholder ?? `Filter by ${filter.label}`}
            className="gogo-input mt-4 w-full px-3 py-2 text-sm"
          />
        );
      }

      if (filter.type === 'date') {
        if (operator === 'between') {
          const current = Array.isArray(value) ? value : ['', ''];
          return (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                value={current[0] ?? ''}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, [filter.key]: [event.target.value, current[1] ?? ''] }))}
                className="gogo-input w-full px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={current[1] ?? ''}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, [filter.key]: [current[0] ?? '', event.target.value] }))}
                className="gogo-input w-full px-3 py-2 text-sm"
              />
            </div>
          );
        }

        return (
          <input
            type="date"
            value={String(Array.isArray(value) ? value[0] ?? '' : value)}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, [filter.key]: event.target.value }))}
            className="gogo-input mt-4 w-full px-3 py-2 text-sm"
          />
        );
      }

      if (!isMultiOperator) {
        return (
          <div className="mt-4 space-y-2">
            {(filter.options ?? []).map((option) => {
              const checked = !Array.isArray(value) && value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraftFilters((prev) => ({ ...prev, [filter.key]: option.value }))}
                  className={`flex w-full items-center justify-between rounded-[var(--radius-input)] border px-3 py-2.5 text-left text-sm transition ${checked ? 'border-[var(--gogo-primary)] bg-[var(--gogo-grey-100)] text-[var(--gogo-primary)]' : 'border-[var(--gogo-divider)] text-[var(--gogo-text-primary)] hover:bg-[var(--gogo-grey-100)]'}`}
                >
                  <span>{option.label}</span>
                  {checked && <span className="h-2.5 w-2.5 rounded-full bg-[var(--gogo-primary)]" />}
                </button>
              );
            })}
          </div>
        );
      }

      const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
      return (
        <div className="mt-4 flex flex-wrap gap-2">
          {(filter.options ?? []).map((option) => {
            const checked = selectedValues.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const nextValue = checked
                    ? selectedValues.filter((item) => item !== option.value)
                    : [...selectedValues, option.value];
                  setDraftFilters((prev) => ({ ...prev, [filter.key]: nextValue }));
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${checked ? 'border-[var(--gogo-primary)] bg-[var(--gogo-primary)] text-white' : 'border-[var(--gogo-divider)] bg-[var(--gogo-surface)] text-[var(--gogo-text-secondary)] hover:bg-[var(--gogo-grey-100)]'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    };

    return (
      <div>
        <div className="mt-6">
          <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">{filter.label}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {operatorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOperator(option.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${operator === option.value ? 'border-[var(--gogo-primary)] bg-[var(--gogo-primary)] text-white' : 'border-[var(--gogo-divider)] bg-[var(--gogo-surface)] text-[var(--gogo-primary)] hover:bg-[var(--gogo-grey-100)]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {renderValueControl()}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between ${className}`}>
      <div className="min-w-0 flex-1" ref={containerRef}>
        <div className="relative max-w-3xl">
          <div className="gogo-card overflow-hidden border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
            <div className="flex min-h-12 items-center gap-2 px-3 py-1.5">
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(true);
                  setPopoverMode('advanced-list');
                  setDraftFilters(activeFilters);
                  setDraftOperators(activeOperators);
                  setExpandedFilterKey(null);
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${popoverMode !== 'history' || activeCount > 0 ? 'bg-[var(--gogo-grey-100)] text-[var(--gogo-primary)]' : 'text-[var(--gogo-text-secondary)] hover:bg-[var(--gogo-grey-100)]'}`}
                title="Advanced filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gogo-primary)] px-1 text-[10px] font-semibold text-white">
                    {activeCount}
                  </span>
                )}
              </button>

              <div className="relative flex flex-1 items-center gap-2">
                <Search className="pointer-events-none shrink-0 text-[var(--gogo-text-secondary)] h-4 w-4" />
                {visibleInlineFilters.length > 0 && (
                  <div className="flex shrink-0 items-center gap-1">
                    {visibleInlineFilters.map((entry) => (
                      <button
                        key={entry.key}
                        type="button"
                        onClick={() => onFilterClear?.(entry.key)}
                        className="inline-flex max-w-[148px] items-center gap-1 rounded-full border border-[var(--gogo-divider)] bg-[var(--gogo-grey-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--gogo-primary)]"
                      >
                        <span className="truncate">{filters.find((filter) => filter.key === entry.key)?.label ?? entry.key}</span>
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    ))}
                    {hiddenInlineFilterCount > 0 && (
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--gogo-grey-100)] px-1.5 text-[11px] font-medium text-[var(--gogo-text-secondary)]">
                        +{hiddenInlineFilterCount}
                      </span>
                    )}
                  </div>
                )}
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  onFocus={() => {
                    setPopoverOpen(true);
                    setPopoverMode('history');
                    setExpandedFilterKey(null);
                  }}
                  onKeyDown={handleKeyDown}
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-16 text-sm text-[var(--gogo-text-primary)] placeholder:text-[var(--gogo-text-secondary)] focus:outline-none"
                />
                <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {(searchValue || activeCount > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        onSearchChange?.('');
                        onFilterClearAll?.();
                        onSearch?.();
                      }}
                      className="rounded-full p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="rounded-full p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)]"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {popoverOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-[420px] overflow-hidden rounded-[var(--radius-modal)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-hover)]">
              {popoverMode === 'history' ? (
                <div className="max-h-[32rem] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[var(--gogo-divider)] px-4 py-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--gogo-text-primary)]">Recent Searches</p>
                      <p className="mt-0.5 text-sm text-[var(--gogo-text-secondary)]">Pick up where you left off.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPopoverOpen(false)}
                      className="rounded-full p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {quickFilterActions.length > 0 && (
                    <div className="border-b border-[var(--gogo-divider)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gogo-text-secondary)]">Quick Filters</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quickFilterActions.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => handleQuickFilter(action.apply())}
                            className="rounded-full border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-3 py-1.5 text-sm font-medium text-[var(--gogo-text-primary)] transition hover:border-[var(--gogo-primary)] hover:text-[var(--gogo-primary)]"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gogo-text-secondary)]">History</p>
                      {searchHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => persistHistory([])}
                          className="text-xs font-medium text-[var(--gogo-primary)] transition hover:opacity-80"
                        >
                          Clear history
                        </button>
                      )}
                    </div>

                    {searchHistory.length > 0 ? (
                      <div className="space-y-2">
                        {searchHistory.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-2 rounded-[var(--radius-input)] border border-[var(--gogo-divider)] px-3 py-3">
                            <button
                              type="button"
                              onClick={() => handleRestoreHistory(entry)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="truncate text-sm font-medium text-[var(--gogo-text-primary)]">{entry.label}</p>
                              <p className="mt-1 text-xs text-[var(--gogo-text-secondary)]">{formatTimeAgo(entry.timestamp)}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeHistoryEntry(entry.id)}
                              className="rounded-full p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[var(--radius-input)] border border-dashed border-[var(--gogo-divider)] px-4 py-6 text-center">
                        <p className="text-sm font-medium text-[var(--gogo-text-primary)]">No recent searches</p>
                        <p className="mt-1 text-xs text-[var(--gogo-text-secondary)]">Search once and it will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : popoverMode === 'advanced-list' ? (
                <div className="max-h-[32rem] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[var(--gogo-divider)] px-4 py-3">
                    <p className="text-lg font-semibold text-[var(--gogo-text-primary)]">Advanced Filters</p>
                    <button
                      type="button"
                      onClick={() => setPopoverOpen(false)}
                      className="rounded-full p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {activeFilterEntries.length > 0 && (
                    <div className="border-b border-[var(--gogo-divider)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">Active Filters ({activeFilterEntries.length})</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeFilterEntries.map((entry) => (
                          <button
                            key={entry.key}
                            type="button"
                            onClick={() => onFilterClear?.(entry.key)}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--gogo-primary)] px-2.5 py-1 text-xs font-medium text-white"
                          >
                            <span className="max-w-[240px] truncate">{entry.label}</span>
                            <X className="h-3 w-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    {filters.map((filter) => {
                      const currentValue = activeFilters[filter.key];
                      const summary = formatFilterValue(filter, currentValue, activeOperators[filter.key]);
                      return (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => {
                            setPopoverMode('advanced-detail');
                            setExpandedFilterKey(filter.key);
                          }}
                          className="flex w-full items-center justify-between border-b border-[var(--gogo-divider)] px-4 py-4 text-left transition hover:bg-[var(--gogo-grey-100)]"
                        >
                          <div>
                            <p className="text-sm font-medium text-[var(--gogo-text-primary)]">{filter.label}</p>
                            <p className={`mt-1 text-sm ${currentValue ? 'font-medium text-[var(--gogo-primary)]' : 'text-[var(--gogo-text-secondary)]'}`}>
                              {summary}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[var(--gogo-text-secondary)]" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 px-4 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftFilters({});
                        setDraftOperators({});
                        onFilterClearAll?.();
                      }}
                      className="flex-1 rounded-[var(--radius-button)] border border-[var(--gogo-divider)] px-4 py-2.5 text-sm font-medium text-[var(--gogo-primary)] transition hover:bg-[var(--gogo-grey-100)]"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyDraftFilters}
                      className="flex-1 rounded-[var(--radius-button)] bg-[var(--gogo-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--gogo-primary-dark)]"
                    >
                      Search
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-[34rem] overflow-y-auto">
                  <div className="flex items-center gap-3 border-b border-[var(--gogo-divider)] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedFilterKey(null);
                        setPopoverMode('advanced-list');
                      }}
                      className="rounded-full p-1 text-[var(--gogo-text-secondary)] transition hover:bg-[var(--gogo-grey-100)]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="text-lg font-semibold text-[var(--gogo-text-primary)]">
                      {filters.find((filter) => filter.key === expandedFilterKey)?.label ?? 'Filter'}
                    </p>
                  </div>

                  {activeFilterEntries.length > 0 && (
                    <div className="border-b border-[var(--gogo-divider)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">Active Filters ({activeFilterEntries.length})</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeFilterEntries.map((entry) => (
                          <button
                            key={entry.key}
                            type="button"
                            onClick={() => onFilterClear?.(entry.key)}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--gogo-primary)] px-2.5 py-1 text-xs font-medium text-white"
                          >
                            <span className="max-w-[240px] truncate">{entry.label}</span>
                            <X className="h-3 w-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-5">
                    {filters.filter((filter) => filter.key === expandedFilterKey).map((filter) => (
                      <section key={filter.key}>{renderFilterEditor(filter)}</section>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 border-t border-[var(--gogo-divider)] px-4 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!expandedFilterKey) return;
                        const selectedFilter = filters.find((filter) => filter.key === expandedFilterKey);
                        if (!selectedFilter) return;
                        setDraftFilters((prev) => ({ ...prev, [expandedFilterKey]: selectedFilter.type === 'multiselect' ? [] : '' }));
                        setDraftOperators((prev) => ({ ...prev, [expandedFilterKey]: getDefaultOperator(selectedFilter.type) }));
                      }}
                      className="flex-1 rounded-[var(--radius-button)] border border-[var(--gogo-divider)] px-4 py-2.5 text-sm font-medium text-[var(--gogo-primary)] transition hover:bg-[var(--gogo-grey-100)]"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyDraftFilters}
                      className="flex-1 rounded-[var(--radius-button)] bg-[var(--gogo-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--gogo-primary-dark)]"
                    >
                      Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        {actions}
      </div>
    </div>
  );
}

export default SearchFilterBar;
