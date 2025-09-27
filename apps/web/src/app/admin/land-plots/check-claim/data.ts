// FILE: apps/web/src/app/admin/land-plots/check-claim/data.ts
// Language: TypeScript

import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";

type CmsList<T> = {
  docs?: T[];
  totalDocs?: number;
  limit?: number;
  totalPages?: number;
  page?: number;
};

type ResourceDoc = {
  id: number | string;
  resourceId?: number | string | null;
  sector?: string | null;
  district?: string | null;
  town?: string | null;
  size?: string | null;
};

type NftIndexDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  index?: number | string | null;
  rarity?: string | null;
};

type StatusDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  rarity?: string | null;

  // messy multi-source fields for index + time
  nftIndex?: unknown;
  index?: unknown;
  NFTIndex?: unknown;
  nft_index?: unknown;

  startTime?: unknown;
  start?: unknown;
  startsAt?: unknown;
  claimStart?: unknown;
  claimAt?: unknown;
  start_date?: unknown;
  startISO?: unknown;
};

export type CheckRow = {
  plotId: number;
  size: string;
  sector: string;
  district: string;
  town: string;
  rarity: string | null; // rarity from Status (claimed) or NFT Index (pending)
};

export type CheckClaimResult = {
  claimed: CheckRow[]; // when Status matches the index (and is in the past)
  pending: CheckRow[]; // NFT Index rows that did not match a Status
};

// ---------- utils ----------
function toInt(u: unknown): number | null {
  if (typeof u === "number" && Number.isFinite(u)) return Math.trunc(u);
  if (typeof u === "string") {
    const n = Number(u);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}
function s(u: unknown): string {
  return typeof u === "string" ? u : "";
}
function isPastISO(iso: string | null): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t <= Date.now();
}
function getStatusIndex(st: unknown): number | null {
  if (!st || typeof st !== "object") return null;
  const obj = st as Record<string, unknown>;
  const candidates = [obj.nftIndex, obj.index, obj.NFTIndex, obj.nft_index];
  for (const c of candidates) {
    const n = toInt(c ?? null);
    if (n !== null) return n;
  }
  return null;
}
function getStatusStartISO(st: unknown): string | null {
  if (!st || typeof st !== "object") return null;
  const obj = st as Record<string, unknown>;
  const keys = ["startTime", "start", "startsAt", "claimStart", "claimAt", "start_date", "startISO"];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) {
      const t = Date.parse(v);
      if (Number.isFinite(t)) return new Date(t).toISOString();
    } else if (typeof v === "number" && Number.isFinite(v)) {
      const ms = v < 2_000_000_000 ? v * 1000 : v;
      return new Date(ms).toISOString();
    }
  }
  return null;
}

// ---------- fetchers ----------
async function fetchNftIndexesByIndex(actorDiscordId: string, index: number): Promise<NftIndexDoc[]> {
  const qs = new URLSearchParams({
    limit: "10000",
    depth: "0",
    "where[index][equals]": String(index),
  }).toString();
  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<NftIndexDoc>>(
    actorDiscordId,
    `/api/nft-indexes?${qs}`,
    { method: "GET" }
  );
  return (res?.docs ?? []).filter((d): d is NftIndexDoc => !!d && typeof d === "object");
}

async function fetchResourcesByIds(actorDiscordId: string, ids: number[]): Promise<Map<number, ResourceDoc>> {
  const out = new Map<number, ResourceDoc>();
  if (ids.length === 0) return out;
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const qs = new URLSearchParams({ limit: "10000", depth: "0" });
    qs.set("where[resourceId][in]", chunk.join(","));
    const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<ResourceDoc>>(
      actorDiscordId,
      `/api/resources?${qs.toString()}`,
      { method: "GET" }
    );
    for (const d of res?.docs ?? []) {
      const rid = toInt((d as { resourceId?: unknown }).resourceId ?? null);
      if (rid !== null) out.set(rid, d as ResourceDoc);
    }
  }
  return out;
}

async function fetchStatusesForPlots(actorDiscordId: string, ids: number[]): Promise<StatusDoc[]> {
  const out: StatusDoc[] = [];
  if (ids.length === 0) return out;
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const qs = new URLSearchParams({ limit: "10000", depth: "0" });
    qs.set("where[landPlotId][in]", chunk.join(","));
    const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<StatusDoc>>(
      actorDiscordId,
      `/api/statuses?${qs.toString()}`,
      { method: "GET" }
    );
    for (const d of res?.docs ?? []) if (d && typeof d === "object") out.push(d as StatusDoc);
  }
  return out;
}

// ---------- core ----------
export async function checkClaimByIndex(actorDiscordId: string, index: number): Promise<CheckClaimResult> {
  // 1) find all nft-indexes with that numeric index
  const indexes = await fetchNftIndexesByIndex(actorDiscordId, index);

  // collect all resource ids
  const plotIds: number[] = [];
  for (const d of indexes) {
    const rid = toInt(d.landPlotId ?? null);
    if (rid !== null) plotIds.push(rid);
  }
  const uniquePlotIds = Array.from(new Set(plotIds));

  // 2) hydrate resources
  const resourcesById = await fetchResourcesByIds(actorDiscordId, uniquePlotIds);

  // 3) fetch statuses for those plots
  const statuses = await fetchStatusesForPlots(actorDiscordId, uniquePlotIds);

  // Build quick lookup: plotId -> most relevant Status that:
  // - has the same nftIndex value
  // - and is already started (start time in the past)
  const nowMatches = new Map<number, StatusDoc>();
  for (const st of statuses) {
    const pid = toInt(st.landPlotId ?? null);
    if (pid === null) continue;
    const stIdx = getStatusIndex(st);
    if (stIdx !== index) continue;
    const started = isPastISO(getStatusStartISO(st));
    if (!started) continue;
    nowMatches.set(pid, st);
  }

  const claimed: CheckRow[] = [];
  const pending: CheckRow[] = [];

  // If any claimed exists for that index, return all claimed rows (there may be more than one).
  for (const [pid, st] of nowMatches.entries()) {
    const res = resourcesById.get(pid);
    if (!res) continue;
    claimed.push({
      plotId: pid,
      size: s(res.size),
      sector: s(res.sector),
      district: s(res.district),
      town: s(res.town),
      rarity: s(st.rarity) || null,
    });
  }

  if (claimed.length === 0) {
    // No matching status → show pending candidates from NFT Indexes, ordered by plot id asc
    const rows: CheckRow[] = [];
    for (const ix of indexes) {
      const pid = toInt(ix.landPlotId ?? null);
      if (pid === null) continue;
      const res = resourcesById.get(pid);
      if (!res) continue;
      rows.push({
        plotId: pid,
        size: s(res.size),
        sector: s(res.sector),
        district: s(res.district),
        town: s(res.town),
        rarity: s(ix.rarity) || null,
      });
    }
    rows.sort((a, b) => a.plotId - b.plotId);
    pending.push(...rows);
  }

  return { claimed, pending };
}
