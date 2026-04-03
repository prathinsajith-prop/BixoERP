"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
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
    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--gogo-divider)' }}>
      {/* Left: rows per page */}
      <div className="flex items-center gap-2">
        {onPageSizeChange && pageSize && (
          <>
            <span className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
              className="rounded-lg border px-2 py-1 text-xs focus:outline-none"
              style={{
                borderColor: 'var(--gogo-divider)',
                backgroundColor: 'var(--gogo-surface)',
                color: 'var(--gogo-text-primary)',
                borderRadius: 'var(--radius-input)',
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}
        {totalItems !== undefined && rangeStart !== undefined && rangeEnd !== undefined && (
          <span className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
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
            className="flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--gogo-divider)', color: 'var(--gogo-text-secondary)', backgroundColor: 'var(--gogo-surface)' }}
            title="Previous"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`el-${i}`} className="flex h-7 w-7 items-center justify-center text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors"
                style={
                  p === page
                    ? { backgroundColor: 'var(--gogo-primary)', color: '#fff', borderRadius: 'var(--radius-button)' }
                    : { color: 'var(--gogo-text-secondary)', backgroundColor: 'transparent' }
                }
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--gogo-divider)', color: 'var(--gogo-text-secondary)', backgroundColor: 'var(--gogo-surface)' }}
            title="Next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
