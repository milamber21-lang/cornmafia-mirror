// FILE: apps/web/src/components/admin/ThemeTokensTable.tsx
// Language: TSX
"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  AlertBanner,
  Pagination,
  PillSwatch,
} from "@/components/ui";
import ThemeTokensPanel from "./ThemeTokensPanel";

type ThemeToken = {
  id: string | number;
  key: string;
  label: string;
  preview?: string | null; // raw value from DB (e.g., "#rrggbb", "var(--x)", or "--x")
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export interface ThemeTokensTableProps {
  initialTokens: ThemeToken[];
}

const PAGE_SIZE = 20;

export default function ThemeTokensTable({ initialTokens }: ThemeTokensTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tokens, setTokens] = useState<ThemeToken[]>(initialTokens);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // live search
  const [search, setSearch] = useState<string>(searchParams.get("q") ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search) params.set("q", search);
      else params.delete("q");
      params.set("p", "1");
      router.replace(`?${params.toString()}`);
    }, 250);
    return () => clearTimeout(t);
  }, [search, router, searchParams]);

  // panel state
  const createOpen = searchParams.get("create") === "1";
  const editId = searchParams.get("edit");

  const [selectedToken, setSelectedToken] = useState<ThemeToken | null>(null);

  const editingToken = useMemo(() => {
    if (selectedToken) return selectedToken;
    if (!editId) return null;
    return tokens.find((t) => String(t.id) === String(editId)) ?? null;
  }, [selectedToken, editId, tokens]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? tokens.filter(
          (t) =>
            t.key.toLowerCase().includes(q) ||
            (t.label || "").toLowerCase().includes(q)
        )
      : tokens;
    return list.slice().sort((a, b) => a.key.localeCompare(b.key));
  }, [tokens, search]);

  // pagination
  const urlPage = Number(searchParams.get("p") ?? "1") || 1;
  const [page, setPage] = useState<number>(urlPage);
  useEffect(() => setPage(urlPage), [urlPage]);
  const total = filtered.length;
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const openCreate = useCallback(() => {
    setSelectedToken(null);
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    params.set("create", "1");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const openEdit = useCallback(
    (id: string | number) => {
      const instant = tokens.find((t) => String(t.id) === String(id)) || null;
      setSelectedToken(instant);

      const params = new URLSearchParams(searchParams);
      params.delete("create");
      params.set("edit", String(id));
      router.push(`?${params.toString()}`);
      if (typeof window !== "undefined") {
        console.debug("[ThemeTokens] openEdit", { id, instant });
      }
    },
    [router, searchParams, tokens]
  );

  const closePanel = useCallback(() => {
    setSelectedToken(null);
    const params = new URLSearchParams(searchParams);
    params.delete("create");
    params.delete("edit");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // server refresh
  const refreshFromServer = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/theme-tokens", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to refresh (${res.status})`);
      const data = (await res.json()) as { docs?: ThemeToken[] };
      setTokens(data.docs ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to refresh data.";
      setError(msg);
    }
  }, []);

  const handleSaved = useCallback(async () => {
    await refreshFromServer();
  }, [refreshFromServer]);

  async function toggleEnabled(t: ThemeToken) {
    if (busyId) return;
    setBusyId(String(t.id));
    setError("");
    try {
      const res = await fetch("/api/admin/theme-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "update",
          id: t.id,
          data: { enabled: !t.enabled },
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Toggle failed (${res.status})`);
      }
      await refreshFromServer();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to toggle status.";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteToken(t: ThemeToken) {
    if (busyId) return;
    if (!confirm(`Delete token "${t.key}"? This cannot be undone.`)) return;
    setBusyId(String(t.id));
    setError("");
    try {
      const res = await fetch("/api/admin/theme-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "delete", id: t.id }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Delete failed (${res.status})`);
      }
      await refreshFromServer();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete token.";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top row: Left=total, Middle=centered search, Right=button */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {/* Left */}
        <div className="text-sm text-[var(--color-muted)]">{tokens.length} total tokens</div>

        {/* Middle (center the input, constrain width) */}
        <div className="flex justify-center">
          <Input
            placeholder="Search by key or label"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-[360px] text-center placeholder:text-center"
          />
        </div>

        {/* Right */}
        <div className="justify-self-end">
          <Button variant="green" onClick={openCreate}>
            Create Theme
          </Button>
        </div>
      </div>

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <Table className="min-w-full text-sm">
          {/* Column widths: 10/20/20/20/10/10/10 */}
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>

          <THead>
            <TR>
              <TH className="text-center">Color</TH>
              <TH className="text-center">Key</TH>
              <TH className="text-center">Label</TH>
              <TH className="text-center">Preview</TH>
              <TH className="text-center">Status</TH>
              <TH className="text-center">Delete</TH>
              <TH className="text-center">Action</TH>
            </TR>
          </THead>

          <TBody>
            {pageItems.map((t) => (
              <TR key={String(t.id)}>
                {/* Color uses raw preview directly (normalized) */}
                <TD className="text-center">
                  <PillSwatch rawColor={t.preview ?? undefined} size="lg" />
                </TD>

                <TD className="text-center">{t.key}</TD>
                <TD className="text-center">{t.label}</TD>

                {/* Preview: show original raw value only */}
                <TD className="text-center">
                  {t.preview && t.preview.trim().length > 0 ? (
                    <span className="break-all">{t.preview}</span>
                  ) : (
                    <span className="text-[var(--color-muted)]">—</span>
                  )}
                </TD>

                <TD className="text-center">
                  {t.enabled ? (
                    <Button
                      variant="accent"
                      onClick={() => toggleEnabled(t)}
                      loading={busyId === String(t.id)}
                    >
                      {busyId === String(t.id) ? "…" : "Disable"}
                    </Button>
                  ) : (
                    <Button
                      variant="green"
                      onClick={() => toggleEnabled(t)}
                      loading={busyId === String(t.id)}
                    >
                      {busyId === String(t.id) ? "…" : "Enable"}
                    </Button>
                  )}
                </TD>

                <TD className="text-center">
                  <Button
                    variant="accent"
                    onClick={() => deleteToken(t)}
                    loading={busyId === String(t.id)}
                  >
                    Delete
                  </Button>
                </TD>

                <TD className="text-center">
                  <Button
                    variant="neutral"
                    onClick={() => openEdit(t.id)}
                    disabled={busyId === String(t.id)}
                  >
                    Edit
                  </Button>
                </TD>
              </TR>
            ))}

            {pageItems.length === 0 ? (
              <TR>
                <TD colSpan={7} className="text-center text-[var(--color-muted)] py-8">
                  No tokens match your search.
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => {
          setPage(p);
          const params = new URLSearchParams(searchParams);
          params.set("p", String(p));
          router.replace(`?${params.toString()}`);
        }}
      />

      <ThemeTokensPanel
        open={createOpen || !!editId}
        mode={createOpen ? "create" : "edit"}
        token={editingToken}
        onClose={closePanel}
        onSaved={handleSaved}
      />
    </div>
  );
}
