// FILE: apps/cms/src/jobs/claimSync.ts
// Language: TypeScript

import type { Payload, CollectionSlug } from "payload";

/** ===========================
 *  Runtime logging controls (env-gated)
 *  =========================== */
const LOG_HTTP = process.env.CLAIM_SYNC_LOG === "1";
const LOG_HTTP_BODIES = process.env.CLAIM_SYNC_LOG_BODIES === "1"; // include (truncated) response bodies
const LOG_PREFIX = "claim-sync";

/** ===========================
 *  Types & runtime type guards
 *  =========================== */
type StatusItem = {
  landPlotId: number;
  startTime: string | null;
  lockedAt: string | null;
  playerUserFavoriteId: string | null;
  hasPendingClaim: boolean;
  nftIndex: number | null;
  rarity: string | null;
  myLandPlot: boolean;
  hasAnyEntry: boolean;
};
type StatusResponse = { statuses: StatusItem[] };

function isStatusItem(u: unknown): u is StatusItem {
  if (!u || typeof u !== "object") return false;
  const o = u as Record<string, unknown>;
  const isBool = (x: unknown) => typeof x === "boolean";
  const isNumOrNull = (x: unknown) => x === null || (typeof x === "number" && Number.isFinite(x));
  const isStrOrNull = (x: unknown) => x === null || typeof x === "string";
  return (
    typeof o.landPlotId === "number" &&
    isStrOrNull(o.startTime) &&
    isStrOrNull(o.lockedAt) &&
    isStrOrNull(o.playerUserFavoriteId) &&
    isBool(o.hasPendingClaim) &&
    isNumOrNull(o.nftIndex) &&
    isStrOrNull(o.rarity) &&
    isBool(o.myLandPlot) &&
    isBool(o.hasAnyEntry)
  );
}
function isStatusResponse(u: unknown): u is StatusResponse {
  if (!u || typeof u !== "object") return false;
  const o = u as Record<string, unknown>;
  if (!Array.isArray(o.statuses)) return false;
  return o.statuses.every(isStatusItem);
}

type NftInstanceItem = {
  id: string;
  name: string;
  index: number;
  tag: string;
  rarity: string;
  collectionName: string;
};
type NftInstancesResponse = { nftInstances: NftInstanceItem[] };

function isNftInstanceItem(u: unknown): u is NftInstanceItem {
  if (!u || typeof u !== "object") return false;
  const o = u as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.index === "number" &&
    Number.isFinite(o.index) &&
    typeof o.tag === "string" &&
    typeof o.rarity === "string" &&
    typeof o.collectionName === "string"
  );
}
function isNftInstancesResponse(u: unknown): u is NftInstancesResponse {
  if (!u || typeof u !== "object") return false;
  const o = u as Record<string, unknown>;
  if (!Array.isArray(o.nftInstances)) return false;
  return o.nftInstances.every(isNftInstanceItem);
}

/** ===========================
 *  Logging helpers
 *  =========================== */
function truncate(s: string, max = 800): string {
  return s.length > max ? s.slice(0, max) + `…[+${s.length - max} more chars]` : s;
}
function logInfo(payload: Payload, msg: string, meta?: Record<string, unknown>): void {
  const m = { scope: LOG_PREFIX, ...(meta || {}) };
  const l = (payload as { logger?: { info?: (a: unknown, b?: unknown) => unknown } }).logger;
  if (l && typeof l.info === "function") l.info(m, msg);
  else console.log(`[info] ${msg}`, m);
}
function logWarn(payload: Payload, msg: string, meta?: Record<string, unknown>): void {
  const m = { scope: LOG_PREFIX, ...(meta || {}) };
  const l = (payload as { logger?: { warn?: (a: unknown, b?: unknown) => unknown } }).logger;
  if (l && typeof l.warn === "function") l.warn(m, msg);
  else console.warn(`[warn] ${msg}`, m);
}
function logError(payload: Payload, msg: string, meta?: Record<string, unknown>): void {
  const m = { scope: LOG_PREFIX, ...(meta || {}) };
  const l = (payload as { logger?: { error?: (a: unknown, b?: unknown) => unknown } }).logger;
  if (l && typeof l.error === "function") l.error(m, msg);
  else console.error(`[error] ${msg}`, m);
}

/** ===========================
 *  HTTP helper (with structured logging)
 *  =========================== */
async function fetchJson(
  payload: Payload,
  url: string,
  opts?: { cacheBust?: boolean }
): Promise<unknown> {
  // Optional cache busting for endpoints that might be cached by proxies
  const finalUrl =
    opts?.cacheBust === true
      ? (() => {
          const u = new URL(url);
          u.searchParams.set("_ts", String(Date.now()));
          return u.toString();
        })()
      : url;

  const started = Date.now();
  if (LOG_HTTP) logInfo(payload, "HTTP request", { url: finalUrl });

  let res: Response;
  try {
    res = await fetch(finalUrl, {
      method: "GET",
      headers: {
        // Nudge any intermediary caches — especially helpful for scheduled runs
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (e: unknown) {
    logError(payload, "HTTP network error", { url: finalUrl, error: e instanceof Error ? e.message : String(e) });
    throw e;
  }

  const elapsedMs = Date.now() - started;

  // Always read text once (lets us both log and parse)
  let text = "";
  try {
    text = await res.text();
  } catch {
    // ignore body read failure
  }

  // Extract a few rate-limit headers (if present)
  const hdr = (name: string): string | undefined => {
    const v = res.headers.get(name);
    return typeof v === "string" ? v : undefined;
  };
  const meta: Record<string, unknown> = {
    url: finalUrl,
    status: res.status,
    elapsedMs,
    retryAfter: hdr("retry-after"),
    rlLimit: hdr("x-ratelimit-limit"),
    rlRemaining: hdr("x-ratelimit-remaining"),
    rlReset: hdr("x-ratelimit-reset"),
  };

  if (res.status === 403 || res.status === 429) {
    logWarn(payload, "Rate limited response", {
      ...meta,
      body: LOG_HTTP_BODIES ? truncate(text) : undefined,
    });
    throw new Error(`Rate limited (${res.status}) at ${finalUrl}`);
  }

  if (!res.ok) {
    logWarn(payload, "Non-2xx response", {
      ...meta,
      body: LOG_HTTP_BODIES ? truncate(text) : undefined,
    });
    throw new Error(`HTTP ${res.status} at ${finalUrl}`);
  }

  if (LOG_HTTP) {
    logInfo(payload, "HTTP success", {
      ...meta,
      body: LOG_HTTP_BODIES ? truncate(text) : undefined,
    });
  }

  try {
    return text.length ? (JSON.parse(text) as unknown) : ({} as unknown);
  } catch (e: unknown) {
    logError(payload, "JSON parse error", { url: finalUrl, status: res.status, bodySnippet: truncate(text) });
    throw e;
  }
}

/** ===========================
 *  Small helpers
 *  =========================== */
function isNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}
function isString(x: unknown): x is string {
  return typeof x === "string";
}
function pickDocId(doc: unknown): string | number | undefined {
  if (doc && typeof doc === "object") {
    const v = (doc as { id?: unknown }).id;
    if (isString(v) || isNumber(v)) return v;
  }
  return undefined;
}
function isPastISODate(s: unknown): boolean {
  if (typeof s !== "string") return false;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return false;
  return t <= Date.now();
}

async function findAll<TDoc extends Record<string, unknown>>(
  payload: Payload,
  opts: {
    collection: CollectionSlug | string;
    limitPerPage?: number;
    where?: Record<string, unknown> | undefined;
  }
): Promise<TDoc[]> {
  const limit = typeof opts.limitPerPage === "number" ? opts.limitPerPage : 500;
  const col = opts.collection as unknown as CollectionSlug;
  const out: TDoc[] = [];
  let page = 1;
  for (;;) {
    const r = await payload.find({
      collection: col,
      where: (opts.where as unknown) as never,
      limit,
      page,
    });
    for (const d of r.docs as unknown[]) {
      if (d && typeof d === "object") out.push(d as TDoc);
    }
    if (page >= r.totalPages) break;
    page += 1;
  }
  return out;
}

/** ===========================
 *  STEP 1: Sync Statuses
 *  =========================== */
async function syncStatuses(payload: Payload): Promise<StatusItem[]> {
  const nowISO = new Date().toISOString();

  // Add cache busting on scheduled pulls — avoids sticky proxy caches
  const raw = await fetchJson(
    payload,
    "https://playerpub.api.cornucopiasweb.io/api/v1/land_plots/statuses",
    { cacheBust: true }
  );

  if (!isStatusResponse(raw)) {
    logError(payload, "Unexpected statuses response shape");
    throw new Error("Unexpected statuses response shape.");
  }

  const fetched = raw.statuses.length;
  let upserts = 0;

  for (const s of raw.statuses) {
    const existing = await payload.find({
      collection: "statuses" as CollectionSlug,
      where: ({ landPlotId: { equals: s.landPlotId } } as unknown) as never,
      limit: 1,
    });

    const doc = {
      landPlotId: s.landPlotId,
      startTime: s.startTime,
      lockedAt: s.lockedAt,
      playerUserFavoriteId: s.playerUserFavoriteId ?? null,
      hasPendingClaim: s.hasPendingClaim,
      nftIndex: s.nftIndex,
      rarity: s.rarity ?? null,
      myLandPlot: s.myLandPlot,
      hasAnyEntry: s.hasAnyEntry,
      insertedAt: nowISO,
    } as const;

    if (existing.totalDocs > 0) {
      const idVal = pickDocId((existing.docs as unknown[])[0]);
      if (idVal !== undefined) {
        await payload.update({ collection: "statuses" as CollectionSlug, id: idVal, data: doc });
        upserts++;
      }
    } else {
      await payload.create({ collection: "statuses" as CollectionSlug, data: doc });
      upserts++;
    }
  }

  // Always log a step summary so we can see this on every tick
  logInfo(payload, "Step 1: statuses synced", { fetched, upserts });

  return raw.statuses;
}

/** ===========================
 *  STEP 2: Update ClaimProgress
 *  Rule: mark finished when startTime is in the past (UTC)
 *  =========================== */
async function syncClaimProgress(payload: Payload, statuses: StatusItem[]): Promise<number> {
  const due = statuses.filter((s) => isPastISODate(s.startTime));
  let updates = 0;
  for (const s of due) {
    const existing = await payload.find({
      collection: "claim-progress" as CollectionSlug,
      where: ({ landPlotId: { equals: s.landPlotId } } as unknown) as never,
      limit: 1,
    });

    const data = { landPlotId: s.landPlotId, finished: true } as const;

    if (existing.totalDocs > 0) {
      const idVal = pickDocId((existing.docs as unknown[])[0]);
      if (idVal !== undefined) {
        await payload.update({ collection: "claim-progress" as CollectionSlug, id: idVal, data });
        updates++;
      }
    } else {
      await payload.create({ collection: "claim-progress" as CollectionSlug, data });
      updates++;
    }
  }

  logInfo(payload, "Step 2: claim-progress updated", { due: due.length, updates });
  return updates;
}

/** ===========================
 *  STEP 3 helpers: chain math
 *  =========================== */
type ClaimOrderDoc = { landPlotId: number; nextLandPlotId: number | null };
type ClaimProgressDoc = { landPlotId: number; finished: boolean };
type NftIndexDoc = { id?: string | number; landPlotId: number; nftId: string };

function buildChain(
  orders: ClaimOrderDoc[]
): { head: number | null; nextById: Map<number, number | null>; orderList: number[] } {
  const nextById = new Map<number, number | null>();
  const all = new Set<number>();
  const nexts = new Set<number>();

  for (const o of orders) {
    if (isNumber(o.landPlotId)) {
      all.add(o.landPlotId);
      nextById.set(o.landPlotId, isNumber(o.nextLandPlotId) ? o.nextLandPlotId : null);
      if (isNumber(o.nextLandPlotId)) nexts.add(o.nextLandPlotId);
    }
  }

  const candidates: number[] = [];
  for (const id of all) if (!nexts.has(id)) candidates.push(id);
  const head = candidates.length > 0 ? Math.min(...candidates) : null;

  const orderList: number[] = [];
  const seen = new Set<number>();
  let cur = head ?? null;
  while (cur !== null && !seen.has(cur)) {
    orderList.push(cur);
    seen.add(cur);
    const nxt = nextById.get(cur) ?? null;
    cur = nxt;
  }

  if (orderList.length === 0 && all.size > 0) {
    const start = Math.min(...Array.from(all));
    const seen2 = new Set<number>();
    let k: number | null = start;
    while (k !== null && !seen2.has(k)) {
      orderList.push(k);
      seen2.add(k);
      k = nextById.get(k) ?? null;
    }
  }

  return { head, nextById, orderList };
}

function furthestFinishedIndex(orderList: number[], finishedSet: Set<number>): number {
  let idx = -1;
  for (let i = 0; i < orderList.length; i++) {
    const id = orderList[i]!;
    if (finishedSet.has(id)) idx = i;
    else break;
  }
  return idx;
}
function nextKAfter(orderList: number[], startIndex: number, k: number): number[] {
  const out: number[] = [];
  if (orderList.length === 0 || k <= 0) return out;
  let i = startIndex + 1;
  for (let c = 0; c < k; c++) {
    const pos = i % orderList.length;
    out.push(orderList[pos]!);
    i++;
  }
  return out;
}

/** ===========================
 *  STEP 3: Sync upcoming NFT indexes (with reconciliation)
 *  =========================== */
async function syncNftIndexes(payload: Payload, upcomingCount: number): Promise<void> {
  const orders = await findAll<ClaimOrderDoc>(payload, { collection: "claim-orders" });
  const progress = await findAll<ClaimProgressDoc>(payload, {
    collection: "claim-progress",
    where: { finished: { equals: true } } as unknown as Record<string, unknown>,
  });

  const finishedSet = new Set(progress.filter((p) => p && p.finished === true).map((p) => p.landPlotId));
  const { orderList } = buildChain(orders);
  if (orderList.length === 0) return;

  const startIdx = furthestFinishedIndex(orderList, finishedSet);
  const targets = nextKAfter(orderList, startIdx, upcomingCount);
  logInfo(payload, "Step 3: upcoming targets", { startIdx, upcomingCount, targets });

  const nowISO = new Date().toISOString();

  for (const landPlotId of targets) {
    const url = `https://playerpub.api.cornucopiasweb.io/api/v1/land_plots/${encodeURIComponent(
      String(landPlotId)
    )}/nft_instances`;

    // Add cache busting here too (some CDNs cache aggressively per-path)
    const raw = await fetchJson(payload, url, { cacheBust: true });
    if (!isNftInstancesResponse(raw)) {
      logWarn(payload, "Unexpected nft_instances response", { landPlotId });
      continue;
    }

    const seenIds: string[] = [];
    let upserts = 0;

    for (const it of raw.nftInstances) {
      seenIds.push(it.id);

      const existing = await payload.find({
        collection: "nft-indexes" as CollectionSlug,
        where: ({ and: [{ landPlotId: { equals: landPlotId } }, { nftId: { equals: it.id } }] } as unknown) as never,
        limit: 1,
      });

      const base = {
        landPlotId,
        nftId: it.id,
        name: it.name,
        index: it.index,
        tag: it.tag,
        rarity: it.rarity,
        collectionName: it.collectionName,
      } as const;

      if (existing.totalDocs > 0) {
        const idVal = pickDocId((existing.docs as unknown[])[0]);
        if (idVal !== undefined) {
          await payload.update({
            collection: "nft-indexes" as CollectionSlug,
            id: idVal,
            data: base,
          });
          upserts++;
        }
      } else {
        await payload.create({
          collection: "nft-indexes" as CollectionSlug,
          data: { ...base, insertedAt: nowISO },
        });
        upserts++;
      }
    }

    const existingForPlot = await findAll<NftIndexDoc>(payload, {
      collection: "nft-indexes",
      where: ({ landPlotId: { equals: landPlotId } } as unknown) as Record<string, unknown>,
    });

    let deletions = 0;
    for (const doc of existingForPlot) {
      if (!seenIds.includes(doc.nftId)) {
        const idVal = pickDocId(doc);
        if (idVal !== undefined) {
          await payload.delete({ collection: "nft-indexes" as CollectionSlug, id: idVal });
          deletions++;
        }
      }
    }

    logInfo(payload, "Step 3: nft-indexes upserted & reconciled", {
      landPlotId,
      upserts,
      deletions,
      seen: seenIds.length,
    });
  }
}

/** ===========================
 *  Public API
 *  =========================== */
let isRunning = false;

export async function runClaimSync(payload: Payload, upcomingCount = 20): Promise<{ ok: true }> {
  if (isRunning) {
    if (LOG_HTTP) logWarn(payload, "Run skipped (already running)");
    return { ok: true };
  }
  isRunning = true;
  const started = Date.now();
  try {
    logInfo(payload, "Run started", { upcomingCount });
    const statuses = await syncStatuses(payload); // step 1
    const changed = await syncClaimProgress(payload, statuses); // step 2
    await syncNftIndexes(payload, upcomingCount); // step 3
    logInfo(payload, "Run finished", {
      ms: Date.now() - started,
      statuses: statuses.length,
      claimProgressSetTrue: changed,
    });
    return { ok: true };
  } catch (e: unknown) {
    logError(payload, "Run failed", { error: e instanceof Error ? e.message : String(e) });
    throw e;
  } finally {
    isRunning = false;
  }
}

/** Optional: scheduler you can enable via env */
let timer: NodeJS.Timeout | null = null;
export function scheduleClaimSync(payload: Payload): void {
  if (timer) return;
  const everyMsRaw = process.env.CLAIM_SYNC_MS;
  const everyMs = typeof everyMsRaw === "string" && Number.isFinite(Number(everyMsRaw))
    ? Number(everyMsRaw)
    : 600000;
  logInfo(payload, "Scheduler started", { everyMs });
  timer = setInterval(() => {
    // fire-and-forget; guard prevents overlap
    runClaimSync(payload).catch(() => void 0);
  }, everyMs);
}
