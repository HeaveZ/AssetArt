"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { Button } from "@/frontend/components/ui/button";

interface PaginatorProps {
  total: number;
  page: number;
  pageSize: number;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];

export function AssetTablePaginator({ total, page, pageSize }: PaginatorProps) {
  const [, setQuery] = useQueryStates({
    page: parseAsString.withDefault("1").withOptions({ shallow: false }),
    pageSize: parseAsString.withDefault(String(pageSize)).withOptions({ shallow: false }),
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="bg-surface-muted/30 text-text-muted flex items-center justify-between gap-3 border-t px-3 py-2 text-[11.5px]">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => setQuery({ pageSize: e.target.value, page: "1" })}
          className="bg-surface text-text h-7 rounded-md border px-1.5 text-[11.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
        >
          {ROWS_PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canPrev}
          onClick={() => setQuery({ page: String(page - 1) })}
        >
          Previous
        </Button>
        <span className="num">
          Page <span className="text-text font-medium">{page}</span> of <span className="text-text font-medium">{totalPages}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canNext}
          onClick={() => setQuery({ page: String(page + 1) })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
