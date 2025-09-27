// FILE: apps/web/src/components/ui/basic-elements/Pagination.tsx
"use client";

import * as React from "react";
import { Button } from "./Button";

export type PaginationProps = {
  total: number;            // total items
  page: number;             // 1-based current page
  pageSize: number;         // items per page
  onPageChange: (p: number) => void;
  className?: string;
  showEdges?: boolean;      // show First/Last buttons (default true)
};

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  className,
  showEdges = true,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const canPrev = current > 1;
  const canNext = current < pageCount;

  function goto(p: number) {
    if (p < 1 || p > pageCount) return;
    onPageChange(p);
  }

  // Center controls + right-aligned summary
  // Layout: [spacer] [pager buttons centered] [summary right]
  return (
    <div
      className={[
        "grid grid-cols-[1fr_auto_1fr] items-center gap-3",
        className || "",
      ].join(" ")}
      role="navigation"
      aria-label="Pagination"
    >
      {/* left spacer (keep empty so the middle can truly center) */}
      <div />

      {/* centered pager */}
      <div className="flex items-center gap-2">
        {showEdges && (
          <Button
            size="sm"
            variant="neutral"
            onClick={() => goto(1)}
            disabled={!canPrev}
            aria-label="First page"
          >
            First
          </Button>
        )}
        <Button
          size="sm"
          variant="neutral"
          onClick={() => goto(current - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          Prev
        </Button>

        <span className="text-xs text-white/70 select-none px-1">
          {current} / {pageCount}
        </span>

        <Button
          size="sm"
          variant="neutral"
          onClick={() => goto(current + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          Next
        </Button>
        {showEdges && (
          <Button
            size="sm"
            variant="neutral"
            onClick={() => goto(pageCount)}
            disabled={!canNext}
            aria-label="Last page"
          >
            Last
          </Button>
        )}
      </div>

      {/* right summary */}
      <div className="text-right">
        <span className="text-xs text-white/70">
          Page {current} of {pageCount} — {total} Items
        </span>
      </div>
    </div>
  );
}
