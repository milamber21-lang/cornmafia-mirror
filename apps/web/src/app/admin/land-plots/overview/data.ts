// FILE: apps/web/src/app/admin/land-plots/overview/data.ts
// Language: TypeScript

import {
  HIERARCHY,
  CANON_RARITIES,
  CANON_SIZES,
  canonRarity,
  canonSize,
  toSlug,
  type RarityKey,
  type SizeKey,
  type SectorDef,
  type DistrictDef,
} from "./hierarchy";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";

/** ===========================
 * Public shapes
 * =========================== */

export type OneSizeBucket = {
  plots: number;
  successByRarity: Record<RarityKey, number>;
  /** Finished but with NO rarity → Unclaimed (lowest tier) */
  successUnclaimed: number;
  claimsByRarity: Record<RarityKey, number>;
};

export type SizeCounts = Record<SizeKey, OneSizeBucket>;

export type SectorAggregate = {
  sector: string;
  sectorSlug: string;
  sectorTotals: SizeCounts;
  byDistrict: Record<string, SizeCounts>; // expose by key + slug + label
};

export type DistrictAggregate = {
  sector: string;
  sectorSlug: string;
  district: string;
  districtSlug: string;
  districtTotals: SizeCounts;
  byTown: Record<string, SizeCounts>; // expose by key + slug (+ normalized fallbacks)
};

/** ===========================
 * CMS doc shapes (narrowed)
 * =========================== */

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

type StatusDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  startTime?: unknown;
  rarity?: string | null;
};

type NftIndexDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  rarity?: string | null;
};

/** ===========================
 * Small helpers
 * =========================== */

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
function isPastISODate(raw: unknown): boolean {
  const v = s(raw);
  if (!v) return false;
  const t = Date.parse(v);
  return Number.isFinite(t) && t <= Date.now();
}
function emptyCounts(): SizeCounts {
  const zR: Record<RarityKey, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 0,
    mythic: 0,
  };
  const z: OneSizeBucket = {
    plots: 0,
    successByRarity: { ...zR },
    successUnclaimed: 0,
    claimsByRarity: { ...zR },
  };
  return {
    small: { ...z, successByRarity: { ...zR }, successUnclaimed: 0, claimsByRarity: { ...zR } },
    medium: { ...z, successByRarity: { ...zR }, successUnclaimed: 0, claimsByRarity: { ...zR } },
    large: { ...z, successByRarity: { ...zR }, successUnclaimed: 0, claimsByRarity: { ...zR } },
    epic: { ...z, successByRarity: { ...zR }, successUnclaimed: 0, claimsByRarity: { ...zR } },
    copias: { ...z, successByRarity: { ...zR }, successUnclaimed: 0, claimsByRarity: { ...zR } },
  };
}
function inc(map: Record<RarityKey, number>, key: RarityKey, by = 1): void {
  map[key] = (map[key] ?? 0) + by;
}

function norm(raw: unknown): string {
  const v = s(raw);
  if (!v) return "";
  return v
    .toLowerCase()
    .replace(/[\u2019\u2018\u02BC'`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Accept district key, slug, or label (incl. normalized) */
function matchesDistrict(value: unknown, key: string, slug: string, label: string): boolean {
  const v = s(value);
  if (!v) return false;
  if (v === key || v === slug || v === label || v === toSlug(label)) return true;
  const nv = norm(v);
  return nv === norm(key) || nv === norm(slug) || nv === norm(label) || nv === norm(toSlug(label));
}

/** Accept town key or slug (incl. normalized) */
function matchesTown(value: unknown, key: string, slug: string): boolean {
  const v = s(value);
  if (!v) return false;
  if (v === key || v === slug) return true;
  const nv = norm(v);
  return nv === norm(key) || nv === norm(slug);
}

/** ===========================
 * CMS fetchers
 * =========================== */

async function fetchResourcesFiltered(
  actorDiscordId: string,
  filter: { sector?: string; district?: string; town?: string }
): Promise<ResourceDoc[]> {
  const qs = new URLSearchParams({ limit: "10000", depth: "0" });
  if (filter.sector) qs.set("where[sector][equals]", filter.sector);
  if (filter.district) qs.set("where[district][equals]", filter.district);
  if (filter.town) qs.set("where[town][equals]", filter.town);

  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<ResourceDoc>>(
    actorDiscordId,
    `/api/resources?${qs.toString()}`,
    { method: "GET" }
  );
  const docs = (res?.docs ?? []).filter((d): d is ResourceDoc => !!d && typeof d === "object");
  return docs;
}

async function fetchStatusesForPlotIds(
  actorDiscordId: string,
  ids: number[]
): Promise<StatusDoc[]> {
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

async function fetchNftIndexesForPlotIds(
  actorDiscordId: string,
  ids: number[]
): Promise<NftIndexDoc[]> {
  const out: NftIndexDoc[] = [];
  if (ids.length === 0) return out;
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const qs = new URLSearchParams({ limit: "10000", depth: "0" });
    qs.set("where[landPlotId][in]", chunk.join(","));
    const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<NftIndexDoc>>(
      actorDiscordId,
      `/api/nft-indexes?${qs.toString()}`,
      { method: "GET" }
    );
    for (const d of res?.docs ?? []) if (d && typeof d === "object") out.push(d as NftIndexDoc);
  }
  return out;
}

/** ===========================
 * Core aggregation
 * =========================== */

function accumulateResourcesBySize(resources: ResourceDoc[]): {
  counts: SizeCounts;
  idBySize: Record<SizeKey, number[]>;
} {
  const counts = emptyCounts();
  const idBySize: Record<SizeKey, number[]> = {
    small: [],
    medium: [],
    large: [],
    epic: [],
    copias: [],
  };

  for (const r of resources) {
    const size = canonSize(r.size);
    const rid = toInt(r.resourceId);
    if (!size || rid === null) continue;
    counts[size].plots += 1;
    idBySize[size].push(rid);
  }
  return { counts, idBySize };
}

function accumulateStatusesIntoSuccess(
  into: SizeCounts,
  statuses: StatusDoc[],
  sizeOfId: Map<number, SizeKey>
): void {
  for (const st of statuses) {
    const lp = toInt(st.landPlotId);
    if (lp === null) continue;
    const size = sizeOfId.get(lp);
    if (!size) continue;

    const finished = isPastISODate(st.startTime);
    if (!finished) continue;

    const rk = canonRarity(st.rarity);
    if (rk) {
      inc(into[size].successByRarity, rk, 1);
    } else {
      into[size].successUnclaimed += 1;
    }
  }
}

function accumulateNftIndexesIntoClaims(
  into: SizeCounts,
  indexes: NftIndexDoc[],
  sizeOfId: Map<number, SizeKey>
): void {
  for (const doc of indexes) {
    const lp = toInt(doc.landPlotId);
    if (lp === null) continue;
    const size = sizeOfId.get(lp);
    if (!size) continue;

    const rk = canonRarity(doc.rarity);
    if (!rk) continue;
    inc(into[size].claimsByRarity, rk, 1);
  }
}

/** ===========================
 * Public aggregators
 * =========================== */

export async function aggregateSectorOnce(
  actorDiscordId: string,
  sectorKeyOrSlug: string
): Promise<SectorAggregate> {
  const sectorDef: SectorDef | undefined =
    HIERARCHY.find((s) => s.slug === sectorKeyOrSlug) ??
    HIERARCHY.find((s) => s.key === sectorKeyOrSlug);

  if (!sectorDef) {
    return {
      sector: sectorKeyOrSlug,
      sectorSlug: sectorKeyOrSlug.replace(/ /g, "-"),
      sectorTotals: emptyCounts(),
      byDistrict: {},
    };
  }

  // Fetch all resources in sector by sector name
  const resources = await fetchResourcesFiltered(actorDiscordId, { sector: sectorDef.key });
  const { counts: sectorTotals, idBySize } = accumulateResourcesBySize(resources);

  // Build id -> size map
  const sizeOfId = new Map<number, SizeKey>();
  for (const size of CANON_SIZES) for (const id of idBySize[size]) sizeOfId.set(id, size);

  // Fetch statuses & NFT indexes for all ids in sector
  const allIds = Array.from(sizeOfId.keys());
  const [statuses, indexes] = await Promise.all([
    fetchStatusesForPlotIds(actorDiscordId, allIds),
    fetchNftIndexesForPlotIds(actorDiscordId, allIds),
  ]);

  accumulateStatusesIntoSuccess(sectorTotals, statuses, sizeOfId);
  accumulateNftIndexesIntoClaims(sectorTotals, indexes, sizeOfId);

  // Per-district (accept key, slug, label, normalized)
  const byDistrict: Record<string, SizeCounts> = {};
  for (const d of sectorDef.districts) {
    const dRes = resources.filter((r) => matchesDistrict(r.district, d.key, d.slug, d.label));
    const { counts, idBySize: dIds } = accumulateResourcesBySize(dRes);

    const dIdSet = new Set<number>();
    for (const size of CANON_SIZES) for (const id of dIds[size]) dIdSet.add(id);

    const dSizeOfId = new Map<number, SizeKey>();
    for (const size of CANON_SIZES) for (const id of dIds[size]) dSizeOfId.set(id, size);

    const dStatuses = statuses.filter((t) => dIdSet.has(toInt(t.landPlotId) ?? -1));
    const dIndexes = indexes.filter((t) => dIdSet.has(toInt(t.landPlotId) ?? -1));

    accumulateStatusesIntoSuccess(counts, dStatuses, dSizeOfId);
    accumulateNftIndexesIntoClaims(counts, dIndexes, dSizeOfId);

    byDistrict[d.key] = counts;
    byDistrict[d.slug] = counts;
    byDistrict[d.label] = counts;
    byDistrict[toSlug(d.label)] = counts;
  }

  return {
    sector: sectorDef.key,
    sectorSlug: sectorDef.slug,
    sectorTotals,
    byDistrict,
  };
}

export async function aggregateDistrictOnce(
  actorDiscordId: string,
  sectorSlug: string,
  districtSlug: string
): Promise<DistrictAggregate> {
  const sectorDef = HIERARCHY.find((s) => s.slug === sectorSlug);
  const districtDef: DistrictDef | undefined =
    sectorDef?.districts.find((d) => d.slug === districtSlug) ||
    sectorDef?.districts.find((d) => toSlug(d.label) === districtSlug);
  if (!sectorDef || !districtDef) {
    return {
      sector: sectorSlug.replace(/-/g, " "),
      sectorSlug,
      district: districtSlug.replace(/-/g, " "),
      districtSlug,
      districtTotals: emptyCounts(),
      byTown: {},
    };
  }

  // IMPORTANT: fetch by SECTOR only, then filter in-memory by district (tolerant),
  // to handle CMS rows where district is saved as label.
  const sectorResources = await fetchResourcesFiltered(actorDiscordId, {
    sector: sectorDef.key,
  });
  const districtResources = sectorResources.filter((r) =>
    matchesDistrict(r.district, districtDef.key, districtDef.slug, districtDef.label)
  );

  const { counts: districtTotals, idBySize } = accumulateResourcesBySize(districtResources);

  const sizeOfId = new Map<number, SizeKey>();
  for (const size of CANON_SIZES) for (const id of idBySize[size]) sizeOfId.set(id, size);

  const allIds = Array.from(sizeOfId.keys());
  const [statuses, indexes] = await Promise.all([
    fetchStatusesForPlotIds(actorDiscordId, allIds),
    fetchNftIndexesForPlotIds(actorDiscordId, allIds),
  ]);

  accumulateStatusesIntoSuccess(districtTotals, statuses, sizeOfId);
  accumulateNftIndexesIntoClaims(districtTotals, indexes, sizeOfId);

  // Per-town with tolerant matching; expose under key, slug, and normalized fallbacks
  const byTown: Record<string, SizeCounts> = {};
  for (const t of districtDef.towns) {
    const tRes = districtResources.filter((r) => matchesTown(r.town, t.key, t.slug));
    const { counts, idBySize: tIds } = accumulateResourcesBySize(tRes);

    const tIdSet = new Set<number>();
    for (const size of CANON_SIZES) for (const id of tIds[size]) tIdSet.add(id);

    const tSizeOfId = new Map<number, SizeKey>();
    for (const size of CANON_SIZES) for (const id of tIds[size]) tSizeOfId.set(id, size);

    const tStatuses = statuses.filter((x) => tIdSet.has(toInt(x.landPlotId) ?? -1));
    const tIndexes = indexes.filter((x) => tIdSet.has(toInt(x.landPlotId) ?? -1));

    accumulateStatusesIntoSuccess(counts, tStatuses, tSizeOfId);
    accumulateNftIndexesIntoClaims(counts, tIndexes, tSizeOfId);

    byTown[t.key] = counts;
    byTown[t.slug] = counts;

    const altKey = norm(t.key);
    const altSlug = norm(t.slug);
    if (altKey && !(altKey in byTown)) byTown[altKey] = counts;
    if (altSlug && !(altSlug in byTown)) byTown[altSlug] = counts;
  }

  return {
    sector: sectorDef.key,
    sectorSlug: sectorDef.slug,
    district: districtDef.key,
    districtSlug: districtDef.slug,
    districtTotals,
    byTown,
  };
}
