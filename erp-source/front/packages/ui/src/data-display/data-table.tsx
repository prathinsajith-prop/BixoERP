"use client";

import React, { useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  keyExtractor: (item: T, index: number) => string;
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

// ─── Alignment lookup (O(1) vs function call per cell) ────────────────────────

const ALIGN: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// ─── Sort icon ────────────────────────────────────────────────────────────────

const SortIcon = React.memo(function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <span className={`ml-1 inline-flex flex-col gap-px ${active ? "text-[var(--gogo-primary)]" : "opacity-40"}`}>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className={active && direction === "asc" ? "" : "opacity-35"}>
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className={active && direction === "desc" ? "" : "opacity-35"}>
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  );
});

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const TableSkeleton = React.memo(function TableSkeleton({ cols }: { cols: number }) {
  return (
    <table className="min-w-full border-collapse">
      <thead>
        <tr className="border-b border-[var(--gogo-divider)]">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="bg-[var(--gogo-grey-100)] px-4 py-3">
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--gogo-divider)]" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className="border-b border-[var(--gogo-divider)]">
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} className="px-4 py-3">
                <div className={`h-4 animate-pulse rounded bg-[var(--gogo-grey-100)] ${j === 0 ? "w-3/4" : "w-1/2"}`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

// ─── DataTable ────────────────────────────────────────────────────────────────

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
  const allKeys = useMemo(
    () => data.map((item, i) => keyExtractor(item, i)),
    [data, keyExtractor],
  );

  const allSelected = useMemo(
    () => allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k)),
    [allKeys, selectedKeys],
  );

  const someSelected = useMemo(
    () => !allSelected && selectedKeys.length > 0,
    [allSelected, selectedKeys],
  );

  const toggleAll = useCallback(() => {
    if (allSelected) onSelectionChange?.([]);
    else onSelectionChange?.(allKeys);
  }, [allSelected, allKeys, onSelectionChange]);

  const toggleRow = useCallback(
    (key: string) => {
      if (selectedKeys.includes(key)) onSelectionChange?.(selectedKeys.filter((k) => k !== key));
      else onSelectionChange?.([...selectedKeys, key]);
    },
    [selectedKeys, onSelectionChange],
  );

  const handleSort = useCallback(
    (col: Column<T>) => {
      if (!col.sortable || !onSort) return;
      if (sortKey === col.key) {
        onSort(col.key, sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      } else {
        onSort(col.key, "asc");
      }
    },
    [sortKey, sortDirection, onSort],
  );

  const hasActions = (rowActions?.length ?? 0) > 0;
  const colSpan = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
        <TableSkeleton cols={columns.length + (selectable ? 1 : 0)} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
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
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col)}
                  className={[
                    "select-none bg-[var(--gogo-grey-100)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--gogo-text-secondary)]",
                    ALIGN[col.align ?? "left"],
                    col.sortable ? "cursor-pointer hover:opacity-75" : "",
                    col.headerClassName,
                    col.className,
                  ].filter(Boolean).join(" ")}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        active={sortKey === col.key}
                        direction={sortKey === col.key ? (sortDirection ?? null) : null}
                      />
                    )}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="w-20 bg-[var(--gogo-grey-100)] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--gogo-text-secondary)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gogo-divider)]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-16 text-center text-sm text-[var(--gogo-text-secondary)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, i) => {
                const key = keyExtractor(item, i);
                const isSelected = selectedKeys.includes(key);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={[
                      "h-[var(--gogo-table-row-height,48px)] transition-colors",
                      onRowClick ? "cursor-pointer" : "",
                      isSelected
                        ? "bg-[color-mix(in_srgb,var(--gogo-primary)_8%,transparent)]"
                        : "hover:bg-[var(--gogo-grey-100)]",
                    ].filter(Boolean).join(" ")}
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
                      <td
                        key={col.key}
                        className={[
                          "px-4 py-3 text-sm text-[var(--gogo-text-primary)]",
                          ALIGN[col.align ?? "left"],
                          col.className,
                        ].filter(Boolean).join(" ")}
                      >
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
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
                              className={[
                                "rounded-lg p-1.5 transition-colors hover:bg-[var(--gogo-grey-100)]",
                                action.danger ? "text-red-500" : "text-[var(--gogo-text-secondary)]",
                              ].join(" ")}
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
    </div>
  );
}
