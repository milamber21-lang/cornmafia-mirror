// FILE: apps/web/src/app/admin/land-plots/LandPlotOverviewClient.tsx
// Language: TSX
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button, Input, Table, THead, TBody, TR, TH, TD } from "@/components/ui";
import Checkbox from "@/components/ui/basic-elements/Checkbox";

type Header = {
  resourceId: number;
  sector: string;
  district: string;
  houseNumber: string;
  town: string;
  size: string;
  updatedRel: string;
  updatedAbs: string;
  claimRel: string; // "in 2h 10m" | "Claimed" | "—"
  claimAbs: string; // ISO when future exists
};

type NftIndexDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  name?: string | null;
  rarity?: string | null;
  index?: number | string | null;
  insertedAt?: string | null;
  tag?: string | null; // unused for owner now, kept for compatibility
};

type Row = {
  id: string;
  name: string;
  rarity: string;
  index: number;
  tag: string | null;
  owner: string; // label (preferred) or wallet or "Unknown"
};

function toInt(u: unknown): number | null {
  if (typeof u === "number" && Number.isFinite(u)) return Math.trunc(u);
  if (typeof u === "string") {
    const n = Number(u);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

function str(u: unknown): string {
  return typeof u === "string" ? u : "";
}

const ORDER = ["mythic", "legendary", "rare", "uncommon", "common"] as const;
type RKey = typeof ORDER[number];

function canonRarity(x: string): RKey | null {
  const k = x.trim().toLowerCase();
  if (k === "uncomon") return "uncommon"; // tolerate misspelling
  if ((ORDER as readonly string[]).includes(k)) return k as RKey;
  return null;
}

function rarityClass(r: string): string {
  const k = canonRarity(r);
  switch (k) {
    case "mythic":
      return "text-yellow-400";
    case "legendary":
      return "text-purple-400";
    case "rare":
      return "text-blue-400";
    case "uncommon":
      return "text-green-400";
    case "common":
      return "text-gray-400";
    default:
      return "text-[var(--color-text)]";
  }
}

function toRow(d: unknown): Row | null {
  if (!d || typeof d !== "object") return null;
  const id = String((d as { id?: unknown }).id ?? "");
  const name = str((d as { name?: unknown }).name ?? "");
  const rarity = str((d as { rarity?: unknown }).rarity ?? "");
  const idx = toInt((d as { index?: unknown }).index ?? null);
  const tag = str((d as { tag?: unknown }).tag ?? "") || null;
  if (!id || idx === null) return null;
  return { id, name, rarity, index: idx, tag, owner: "Unknown" };
}

function orderOf(r: string): number {
  const k = canonRarity(r);
  if (!k) return ORDER.length + 1;
  return ORDER.indexOf(k); // 0: mythic ... 4: common
}

// Build the composite key for cross-out based on page header.size + row.index
function keyFor(size: string, index: number): string {
  return `${size}|${index}`;
}

const LS_KEY_HIDE_CROSSED = "cm-hide-crossed-rows";

export default function LandPlotOverviewClient(props: {
  header: Header;
  nftIndexes: NftIndexDoc[];
  takenKeys: string[]; // composite keys "<size>|<index>" already taken
  prevId: number | null;
  nextId: number | null;
  ownerByName: Record<string, string>; // map: NftIndexes.name -> label (preferred) or wallet or "Unknown"
}) {
  const { header, nftIndexes, takenKeys, prevId, nextId, ownerByName } = props;
  const router = useRouter();
  const path = usePathname();
  const initialId = React.useMemo(() => {
    const m = path?.match(/\/admin\/land-plots\/(\d+)/);
    return m ? Number(m[1]) : header.resourceId;
  }, [path, header.resourceId]);

  const [jump, setJump] = React.useState<string>(String(initialId));

  // Persisted preference: hide crossed rows (default true)
  const [hideCrossed, setHideCrossed] = React.useState<boolean>(true);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_HIDE_CROSSED);
      if (raw === null) {
        // default to true if nothing stored
        setHideCrossed(true);
      } else {
        setHideCrossed(raw === "1");
      }
    } catch {
      // ignore
      setHideCrossed(true);
    }
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_HIDE_CROSSED, hideCrossed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [hideCrossed]);

  const taken = React.useMemo(() => new Set<string>(takenKeys), [takenKeys]);

  const rows = React.useMemo(() => {
    const out: Row[] = [];
    for (const d of nftIndexes) {
      const r = toRow(d);
      if (r) {
        // owner matched by NAME -> label (or wallet) provided by server
        const ownerKey = r.name;
        const owner =
          typeof ownerByName[ownerKey] === "string" && ownerByName[ownerKey].trim().length > 0
            ? ownerByName[ownerKey].trim()
            : "Unknown";
        out.push({ ...r, owner });
      }
    }
    return out;
  }, [nftIndexes, ownerByName]);

  const hasData = rows.length > 0;

  // Rarity counts for NOT crossed entries (respect size+index)
  const rarityCounts = React.useMemo(() => {
    const counts: Partial<Record<RKey, number>> = {};
    for (const r of ORDER) counts[r] = 0;
    for (const row of rows) {
      const crossed = taken.has(keyFor(header.size, row.index));
      if (crossed) continue;
      const key = canonRarity(row.rarity);
      if (!key) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts as Record<RKey, number>;
  }, [rows, taken, header.size]);

  // Sorting that prefers NOT crossed first, then rarity (mythic..common), then index, then name
  const sortedFilteredRows = React.useMemo(() => {
    const list = hideCrossed
      ? rows.filter((r) => !taken.has(keyFor(header.size, r.index)))
      : rows.slice();

    list.sort((a, b) => {
      const aCross = taken.has(keyFor(header.size, a.index));
      const bCross = taken.has(keyFor(header.size, b.index));
      if (aCross !== bCross) return aCross ? 1 : -1; // non-crossed first

      const oa = orderOf(a.rarity);
      const ob = orderOf(b.rarity);
      if (oa !== ob) return oa - ob;

      if (a.index !== b.index) return a.index - b.index;

      return a.name.localeCompare(b.name);
    });
    return list;
  }, [rows, taken, header.size, hideCrossed]);

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Resource ID" value={String(header.resourceId)} />
        <InfoCard label="Sector" value={header.sector} />
        <InfoCard label="District" value={header.district} />
        <InfoCard label="House Number" value={header.houseNumber} />
        <InfoCard label="Town" value={header.town} />
        <InfoCard label="Size" value={header.size} />
        <InfoCard label="Updated" value={header.updatedRel || "—"} tooltip={header.updatedAbs} />
        <InfoCard
          label="Claim"
          value={header.claimRel || "—"}
          tooltip={header.claimAbs}
          valueClass={header.claimRel === "Claimed" ? "text-green-500" : ""}
        />
      </div>

      {/* Rarity overview for remaining (not crossed) */}
      <div className="rounded-lg border border-[var(--color-border)] p-3">
        <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">
          Remaining by Rarity
        </div>
        <div className="flex flex-wrap gap-2">
          {ORDER.map((rk) => {
            const n = rarityCounts[rk];
            if (!n) return null;
            return (
              <span
                key={rk}
                className={`px-2 py-1 rounded-full border text-sm ${rarityClass(rk)} border-[var(--color-border)]`}
                title={rk}
              >
                {rk}: {n}
              </span>
            );
          })}
          {ORDER.every((rk) => rarityCounts[rk] === 0) && (
            <span className="text-[var(--color-muted)]">No remaining items.</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const idNum = toInt(jump);
            if (idNum !== null) router.push(`/admin/land-plots/${idNum}`);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={jump}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJump(e.target.value)}
            placeholder="Jump to ID"
          />
          <Button type="submit" variant="neutral">Go</Button>
        </form>

        {/* hide/show crossed rows toggle (persisted) */}
        <div className="ml-auto">
          <Checkbox
            id="hide-crossed"
            checked={hideCrossed}
            onChange={(e) => setHideCrossed(e.currentTarget.checked)}
            label="Hide crossed (claimed) rows"
            variant="neutral"
            size="md"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={prevId === null}
            variant="neutral"
            onClick={() => prevId !== null && router.push(`/admin/land-plots/${prevId}`)}
          >
            Prev
          </Button>
          <Button
            type="button"
            disabled={nextId === null}
            variant="neutral"
            onClick={() => nextId !== null && router.push(`/admin/land-plots/${nextId}`)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* NFT Indexes */}
      {!hasData ? (
        <div className="p-4 rounded-lg border border-[var(--color-border)]">
          This land plot has no data available
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <Table>
            <THead>
              <TR>
                <TH className="text-left w-[46%]">Name</TH>
                <TH className="text-center w-[18%]">Rarity</TH>
                <TH className="text-center w-[18%]">Index</TH>
                <TH className="text-left w-[18%]">Owner</TH>
              </TR>
            </THead>
            <TBody>
              {sortedFilteredRows.map((r) => {
                const crossed = taken.has(keyFor(header.size, r.index));
                return (
                  <TR key={r.id}>
                    <TD className={crossed ? "line-through opacity-70" : ""}>
                      {r.name}
                    </TD>
                    <TD className={`text-center font-semibold ${rarityClass(r.rarity)}`}>
                      {r.rarity}
                    </TD>
                    <TD className={`text-center ${crossed ? "line-through opacity-70" : ""}`}>
                      {r.index}
                    </TD>
                    <TD className="text-left">
                      {r.owner || "Unknown"}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function InfoCard(props: { label: string; value: string; tooltip?: string; valueClass?: string }) {
  return (
    <div className="p-3 rounded-lg border border-[var(--color-border)]" title={props.tooltip || ""}>
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{props.label}</div>
      <div className={`text-lg ${props.valueClass ?? ""}`}>{props.value}</div>
    </div>
  );
}
