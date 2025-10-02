// FILE: apps/web/src/components/ui/CategoryUserFilterBar.tsx
// Language: TSX
"use client";

/**
 * CategoryUserFilterBar — MEDIA MODE (fixes only)
 * - Coerce option values and incoming onChange payloads to strings.
 * - Force options to use String(id) to avoid number/string mismatch.
 * - Keep original layout, URL sync, and overall logic unchanged.
 */

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, DropdownMenuSingle } from "@/components/ui";

type Category = { id: string | number; name: string };
type Subcategory = { id: string | number; name: string; categoryId: string | number };

export type FilterValue = {
  category?: string;
  subcategory?: string;
  q?: string;
};

export type CategoryUserFilterBarProps = {
  categories: Category[];
  subcategories: Subcategory[];

  showCategory?: boolean;
  showSubcategory?: boolean;
  showSearch?: boolean;
  showReset?: boolean;
  showUpload?: boolean;

  uploadHref?: string;
  uploadLabel?: string;

  searchPlaceholder?: string;
  debounceMs?: number;

  value?: FilterValue;
  onChange?: (next: FilterValue) => void;

  className?: string;
};

function useDebounced<T>(value: T, delay = 300) {
  const [d, setD] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
}

function readURL(params: URLSearchParams): FilterValue {
  return {
    category: params.get("cat") ?? undefined,
    subcategory: params.get("sub") ?? undefined,
    q: params.get("q") ?? undefined,
  };
}

function writeURL(router: ReturnType<typeof useRouter>, next: FilterValue, push = false) {
  const url = new URL(window.location.href);
  const setOrDel = (key: string, val?: string) => {
    if (val && val.length > 0) url.searchParams.set(key, val);
    else url.searchParams.delete(key);
  };
  setOrDel("cat", next.category);
  setOrDel("sub", next.subcategory);
  setOrDel("q", next.q);

  // Reset pagination on any filter change
  url.searchParams.delete("page");
  url.searchParams.delete("p");

  const href = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}`;
  if (push) router.push(href);
  else router.replace(href);
}

// Guard kept (unchanged behavior), but now we also accept numbers.
type OptionLike = { value: string | number; label?: string };
function isOptionLike(x: unknown): x is OptionLike {
  return typeof x === "object" && x !== null && "value" in (x as Record<string, unknown>);
}

// Coerce any payload to string
function toValue(maybe: unknown): string {
  if (typeof maybe === "string") return maybe;
  if (typeof maybe === "number") return String(maybe);
  if (isOptionLike(maybe)) {
    const v = (maybe as OptionLike).value;
    return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  }
  return "";
}

export default function CategoryUserFilterBar({
  categories,
  subcategories,
  showCategory = true,
  showSubcategory = true,
  showSearch = true,
  showReset = true,
  showUpload = true,
  uploadHref = "/admin/media?mediaPanel=upload",
  uploadLabel = "Upload media",
  searchPlaceholder = "Search username / alt / filename…",
  debounceMs = 300,
  value,
  onChange,
  className,
}: CategoryUserFilterBarProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const initial = React.useMemo(() => readURL(sp), [sp]);

  const [category, setCategory] = React.useState<string | undefined>(value?.category ?? initial.category);
  const [subcategory, setSubcategory] = React.useState<string | undefined>(value?.subcategory ?? initial.subcategory);
  const [q, setQ] = React.useState<string | undefined>(value?.q ?? initial.q);

  React.useEffect(() => {
    if (!value) return;
    setCategory(value.category);
    setSubcategory(value.subcategory);
    setQ(value.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.category, value?.subcategory, value?.q]);

  const qDebounced = useDebounced(q, debounceMs);

  // Normalize comparison to strings
  const categoryStr = category ? String(category) : undefined;
  const subcatsForCategory = React.useMemo(() => {
    if (!categoryStr) return subcategories;
    return subcategories.filter((s) => String(s.categoryId) === categoryStr);
  }, [categoryStr, subcategories]);

  // Force option values to strings to avoid number/string mismatch
  const categoryOptions = React.useMemo(
    () => [{ value: "", label: "All" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))],
    [categories],
  );
  const subcategoryOptions = React.useMemo(
    () => [{ value: "", label: "All" }, ...subcatsForCategory.map((s) => ({ value: String(s.id), label: s.name }))],
    [subcatsForCategory],
  );

  // Search → replace in URL
  React.useEffect(() => {
    if (!showSearch) return;
    const next: FilterValue = { category: categoryStr, subcategory, q: qDebounced };
    if (!value) writeURL(router, next, false);
    onChange?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, showSearch, categoryStr, subcategory]);

  function handleCategoryChange(nextCatRaw: unknown) {
    const nextCat = toValue(nextCatRaw) || undefined;
    let nextSub: string | undefined = subcategory;
    if (nextCat && nextSub && !subcategories.some((s) => String(s.id) === nextSub && String(s.categoryId) === nextCat)) {
      nextSub = undefined;
    }
    setCategory(nextCat);
    setSubcategory(nextSub);
    const next: FilterValue = { category: nextCat, subcategory: nextSub, q };
    if (!value) writeURL(router, next, true);
    onChange?.(next);
  }

  function handleSubcategoryChange(nextSubRaw: unknown) {
    const nextSub = toValue(nextSubRaw) || undefined;
    setSubcategory(nextSub);
    const next: FilterValue = { category: categoryStr, subcategory: nextSub, q };
    if (!value) writeURL(router, next, true);
    onChange?.(next);
  }

  function handleReset() {
    const next: FilterValue = { category: undefined, subcategory: undefined, q: undefined };
    setCategory(undefined);
    setSubcategory(undefined);
    setQ(undefined);
    if (!value) writeURL(router, next, true);
    onChange?.(next);
  }

  // Keep original grid
  const containerClass = `w-full grid items-end gap-3 md:gap-4 ${className ?? ""}`.trim();
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns:
      "minmax(0,20%) minmax(0,20%) minmax(0,20%) minmax(0,5%) minmax(0,1fr) minmax(0,10%)",
  };
  const cellBase = "min-w-0 flex flex-col gap-1";

  return (
    <div className={containerClass} style={gridStyle}>
      {showCategory ? (
        <div className={cellBase}>
          <Label>Category</Label>
          <DropdownMenuSingle
            options={categoryOptions}
            value={categoryStr ?? ""}
            onChange={handleCategoryChange}
            ariaLabel="Choose category"
          />
        </div>
      ) : (
        <div />
      )}

      {showSubcategory ? (
        <div className={cellBase}>
          <Label>Subcategory</Label>
          <DropdownMenuSingle
            options={subcategoryOptions}
            value={subcategory ?? ""}
            onChange={handleSubcategoryChange}
            ariaLabel="Choose subcategory"
            disabled={subcategoryOptions.length <= 1}
          />
        </div>
      ) : (
        <div />
      )}

      {showSearch ? (
        <div className={cellBase}>
          <Label>Search</Label>
          <Input
            size="md"
            placeholder={searchPlaceholder}
            value={q ?? ""}
            onChange={(e) => setQ(e.currentTarget.value || undefined)}
            aria-label="Search"
          />
        </div>
      ) : (
        <div />
      )}

      {showReset ? (
        <div className="min-w-0 flex items-end">
          <Button variant="neutral" onClick={handleReset} aria-label="Reset filters">
            Reset
          </Button>
        </div>
      ) : (
        <div />
      )}

      <div className="min-w-0" />

      {showUpload ? (
        <div className="min-w-0 flex items-end justify-end">
          <Link href={uploadHref}>
            <Button variant="green">{uploadLabel}</Button>
          </Link>
        </div>
      ) : (
        <div className="min-w-0" />
      )}
    </div>
  );
}
