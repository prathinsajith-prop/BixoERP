"use client";

import React, { useState } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  danger?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  rowActions?: RowAction<T>[];
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`ml-1 inline-flex flex-col gap-px ${active ? "text-[var(--gogo-primary)] opacity-100" : "opacity-40"}`}>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className={active && direction === "asc" ? "opacity-100" : "opacity-35"}>
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className={active && direction === "desc" ? "opacity-100" : "opacity-35"}>
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data found",
  loading = false,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  rowActions,
  sortKey,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  const allKeys = data.map(keyExtractor);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k));
  const someSelected = !allSelected && selectedKeys.length > 0;

  const toggleAll = () => {
    if (allSelected) onSelectionChange?.([]);
    else onSelectionChange?.(allKeys);
  };

  const toggleRow = (key: string) => {
    if (selectedKeys.includes(key)) onSelectionChange?.(selectedKeys.filter((k) => k !== key));
    else onSelectionChange?.([...selectedKeys, key]);
  };

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    if (sortKey === col.key) {
      onSort(col.key, sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
    } else {
      onSort(col.key, 'asc');
    }
  };

  const hasActions = rowActions && rowActions.length > 0;
  const getAlignment = (align?: Column<T>["align"]) => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-10 animate-pulse rounded-lg bg-[var(--gogo-grey-100)]" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--gogo-grey-100)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="gogo-table min-w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--gogo-divider)]">
            {selectable && (
              <th className="w-10 bg-[var(--gogo-grey-100)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-[var(--gogo-divider)] accent-[var(--gogo-primary)]"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`select-none bg-[var(--gogo-grey-100)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--gogo-text-secondary)] ${getAlignment(col.align)} ${col.sortable ? 'cursor-pointer hover:opacity-80' : ''} ${col.headerClassName || ''} ${col.className || ''}`}
                onClick={() => handleSort(col)}
              >
                <span className="inline-flex items-center gap-0.5">
                  {col.header}
                  {col.sortable && (
                    <SortIcon active={sortKey === col.key} direction={sortKey === col.key ? sortDirection ?? null : null} />
                  )}
                </span>
              </th>
            ))}
            {hasActions && (
              <th className="bg-[var(--gogo-grey-100)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--gogo-text-secondary)]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-[var(--gogo-surface)]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)}
                className="px-4 py-14 text-center text-sm text-[var(--gogo-text-secondary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const key = keyExtractor(item);
              const isSelected = selectedKeys.includes(key);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={`h-[var(--gogo-table-row-height)] border-b border-[var(--gogo-divider)] transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[var(--gogo-grey-100)]' : 'hover:bg-[var(--gogo-grey-100)]'}`}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(key)}
                        className="h-4 w-4 rounded border-[var(--gogo-divider)] accent-[var(--gogo-primary)]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-[var(--gogo-text-primary)] ${getAlignment(col.align)} ${col.className || ''}`}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {rowActions!.map((action) => (
                          <button
                            key={action.label}
                            title={action.label}
                            onClick={() => action.onClick(item)}
                            className={`rounded-lg p-1.5 transition-colors hover:bg-[var(--gogo-grey-100)] ${action.danger ? 'text-red-500' : 'text-[var(--gogo-text-secondary)]'}`}
                          >
                            {action.icon ?? <span className="text-xs">{action.label}</span>}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
