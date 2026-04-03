"use client";

import React from "react";
import type { Column } from "./data-table";

interface ListViewProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  title: (item: T) => React.ReactNode;
  subtitle?: (item: T) => React.ReactNode;
  leading?: (item: T) => React.ReactNode;
  trailing?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  className?: string;
}

export function ListView<T>({
  columns,
  data,
  keyExtractor,
  title,
  subtitle,
  leading,
  trailing,
  onRowClick,
  emptyMessage = "No data found",
  loading = false,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  className = "",
}: ListViewProps<T>) {
  const allKeys = data.map(keyExtractor);
  const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.includes(key));
  const someSelected = !allSelected && selectedKeys.length > 0;

  const toggleAll = () => {
    if (allSelected) onSelectionChange?.([]);
    else onSelectionChange?.(allKeys);
  };

  const toggleRow = (key: string) => {
    if (selectedKeys.includes(key)) onSelectionChange?.(selectedKeys.filter((item) => item !== key));
    else onSelectionChange?.([...selectedKeys, key]);
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] p-5 shadow-[var(--shadow-card)]"
          >
            <div className="mb-4 h-5 w-40 rounded bg-[var(--gogo-grey-100)]" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-4 rounded bg-[var(--gogo-grey-100)]" />
              <div className="h-4 rounded bg-[var(--gogo-grey-100)]" />
              <div className="h-4 rounded bg-[var(--gogo-grey-100)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-6 py-12 text-center text-sm text-[var(--gogo-text-secondary)] shadow-[var(--shadow-card)] ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {selectable && (
        <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-4 py-3 shadow-[var(--shadow-card)]">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-[var(--gogo-text-primary)]">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(element) => {
                if (element) element.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-[var(--gogo-divider)] accent-[var(--gogo-primary)]"
            />
            Select all on page
          </label>
          <span className="text-xs text-[var(--gogo-text-secondary)]">{selectedKeys.length} selected</span>
        </div>
      )}

      {data.map((item) => {
        const key = keyExtractor(item);
        const isSelected = selectedKeys.includes(key);

        return (
          <article
            key={key}
            onClick={() => onRowClick?.(item)}
            className={`rounded-[var(--radius-card)] border bg-[var(--gogo-surface)] p-5 shadow-[var(--shadow-card)] transition ${onRowClick ? "cursor-pointer hover:shadow-[var(--shadow-hover)]" : ""} ${isSelected ? "border-[var(--gogo-primary)] bg-[var(--gogo-grey-100)]" : "border-[var(--gogo-divider)]"}`}
          >
            <div className="flex items-start gap-4">
              {selectable && (
                <div className="pt-1" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(key)}
                    className="h-4 w-4 rounded border-[var(--gogo-divider)] accent-[var(--gogo-primary)]"
                  />
                </div>
              )}

              {leading && <div className="shrink-0">{leading(item)}</div>}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--gogo-text-primary)]">{title(item)}</div>
                    {subtitle && (
                      <div className="mt-1 truncate text-xs text-[var(--gogo-text-secondary)]">{subtitle(item)}</div>
                    )}
                  </div>
                  {trailing && <div className="shrink-0" onClick={(event) => event.stopPropagation()}>{trailing(item)}</div>}
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {columns.map((column) => (
                    <div key={column.key} className={`${column.className ?? ""}`}>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gogo-text-secondary)]">
                        {column.header}
                      </dt>
                      <dd className="mt-1 text-sm text-[var(--gogo-text-primary)]">
                        {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? "")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}