"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const rangeStart = totalItems !== undefined && pageSize ? (page - 1) * pageSize + 1 : undefined;
  const rangeEnd = totalItems !== undefined && pageSize ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--gogo-divider)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: rows per page */}
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && pageSize && (
          <>
            <span className="text-xs text-[var(--gogo-text-secondary)]">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
              className="rounded-[var(--radius-input)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] px-2 py-1 text-xs text-[var(--gogo-text-primary)] focus:border-[var(--gogo-primary)] focus:outline-none"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}
        {totalItems !== undefined && rangeStart !== undefined && rangeEnd !== undefined && (
          <span className="text-xs text-[var(--gogo-text-secondary)]">
            {rangeStart}–{rangeEnd} of {totalItems}
          </span>
        )}
      </div>

      {/* Right: page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] text-[var(--gogo-text-secondary)] transition-colors hover:bg-[var(--gogo-grey-100)] disabled:opacity-40"
            title="Previous"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`el-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-[var(--gogo-text-secondary)]">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-button)] px-2 text-xs font-medium transition-colors ${p === page ? 'bg-[var(--gogo-primary)] text-white shadow-[var(--shadow-card)]' : 'text-[var(--gogo-text-secondary)] hover:bg-[var(--gogo-grey-100)]'}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-[var(--gogo-divider)] bg-[var(--gogo-surface)] text-[var(--gogo-text-secondary)] transition-colors hover:bg-[var(--gogo-grey-100)] disabled:opacity-40"
            title="Next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
