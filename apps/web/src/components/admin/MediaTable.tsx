// FILE: apps/web/src/components/admin/MediaTable.tsx
// Language: TSX
"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Button,
  Table, THead, TBody, TR, TH, TD,
  AlertBanner,
  Pagination,
} from "@/components/ui";

const PAGE_SIZE = 20;

type MediaItem = {
  id: string;
  alt: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  category?: string | null;      // preserved for fallback display
  subcategory?: string | null;   // preserved for fallback display
  userDiscordId?: string | null;
  ownerUsername?: string;        // NEW: provided by server
  filename?: string | null;
  url?: string | null;
  updatedAt?: string | null;
};

type ListResponse = {
  items: MediaItem[];
  page: number;
  limit: number;
  totalPages: number;
  totalDocs: number;
};

/** Memo row to cut re-renders */
type RowProps = {
  item: MediaItem;
  onDelete: (id: string) => void;
  onDetail: (id: string) => void;
};
const MediaRow = React.memo(function MediaRow({ item, onDelete, onDetail }: RowProps) {
  const cat =
    (item.categoryName ?? "").trim().length > 0 ? item.categoryName : (item.category ?? "") || "";
  const sub =
    (item.subcategoryName ?? "").trim().length > 0 ? item.subcategoryName : (item.subcategory ?? "") || "";
  const username = (item.ownerUsername || "").trim();

  return (
    <TR key={item.id}>
      <TD className="text-center">
        {item.alt && item.alt.trim().length > 0 ? (
          <span className="break-all">{item.alt}</span>
        ) : (
          <span className="text-[var(--color-muted)]">—</span>
        )}
      </TD>
      <TD className="text-center">{cat || <span className="text-[var(--color-muted)]">—</span>}</TD>
      <TD className="text-center">{sub || <span className="text-[var(--color-muted)]">—</span>}</TD>
      <TD className="text-center">
        {username ? <span className="break-all">{username}</span> : <span className="text-[var(--color-muted)]">—</span>}
      </TD>
      <TD className="text-center">
        <Button variant="accent" onClick={() => onDelete(item.id)}>Delete</Button>
      </TD>
      <TD className="text-center">
        <Button variant="neutral" onClick={() => onDetail(item.id)}>Detail</Button>
      </TD>
    </TR>
  );
});

export default function MediaTable() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = React.useState<ListResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Ensure ?p=1 exists so Pagination works consistently
  React.useEffect(() => {
    if (!searchParams.get("p")) {
      const params = new URLSearchParams(searchParams);
      params.set("p", "1");
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const page = Math.max(1, Number(searchParams.get("p") || "1"));
  const filters = React.useMemo(
    () => ({
      cat: searchParams.get("cat") || "",
      sub: searchParams.get("sub") || "",
      q: (searchParams.get("q") || "").trim(),
    }),
    [searchParams],
  );

  // Abort previous loads when filters/page change
  const controllerRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(async () => {
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const u = new URL("/api/admin/media", window.location.origin);
      if (filters.cat) u.searchParams.set("cat", filters.cat);
      if (filters.sub) u.searchParams.set("sub", filters.sub);
      if (filters.q) u.searchParams.set("q", filters.q);
      u.searchParams.set("page", String(page));
      u.searchParams.set("limit", String(PAGE_SIZE));

      const res = await fetch(u.toString(), { credentials: "include", signal: ctrl.signal });
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const json = (await res.json()) as ListResponse;

      setData(json);
    } catch (err) {
      // treat unknown safely and detect AbortError without using `any`
        const isAbort =
          typeof err === "object" &&
          err !== null &&
          "name" in err &&
          (err as { name?: string }).name === "AbortError";

        if (isAbort) return;

        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
        setData({ items: [], page: 1, limit: PAGE_SIZE, totalDocs: 0, totalPages: 1 });
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }

  }, [filters.cat, filters.sub, filters.q, page]);

  React.useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  // React to "media:reload" from the upload panel (immediate refresh after successful upload)
  React.useEffect(() => {
    function onReload() {
      load();
    }
    window.addEventListener("media:reload", onReload as EventListener);
    return () => window.removeEventListener("media:reload", onReload as EventListener);
  }, [load]);

  const setPageParam = React.useCallback((next: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("p", String(next));
    router.replace(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleDelete = React.useCallback(async (id: string) => {
    if (!confirm("Delete this media file?")) return;
    try {
      const res = await fetch("/api/admin/media/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch {
      setError("Failed to delete media.");
    }
  }, [load]);

  const openDetail = React.useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("mediaPanel", "detail");
    url.searchParams.set("id", id);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }, [router]);

  const items = data?.items ?? [];
  const total = data?.totalDocs ?? 0;

  return (
    <div className="space-y-4">
      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <Table className="min-w-full text-sm">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>

          <THead>
            <TR>
              <TH className="text-center">Alt</TH>
              <TH className="text-center">Category</TH>
              <TH className="text-center">Subcategory</TH>
              <TH className="text-center">User</TH>
              <TH className="text-center">Delete</TH>
              <TH className="text-center">Action</TH>
            </TR>
          </THead>

          <TBody>
            {loading && (
              <TR>
                <TD colSpan={6} className="text-center py-8 text-[var(--color-muted)]">
                  Loading…
                </TD>
              </TR>
            )}

            {!loading && items.map((item) => (
              <MediaRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onDetail={openDetail}
              />
            ))}

            {!loading && items.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-center text-[var(--color-muted)] py-8">
                  No media matches your filters.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => setPageParam(p)}
      />
    </div>
  );
}
