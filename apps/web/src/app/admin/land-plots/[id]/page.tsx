// FILE: apps/web/src/app/admin/land-plots/[id]/page.tsx
// Language: TSX

import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import LandPlotOverviewClient from "../LandPlotOverviewClient";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";

// ---------- shared types ----------
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
  resourceType?: string | null;
  sector?: string | null;
  district?: string | null;
  houseNumber?: string | null;
  town?: string | null;
  size?: string | null;
};

type NftIndexDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  name?: string | null;
  rarity?: string | null;
  index?: number | string | null;
  insertedAt?: string | null;
  tag?: string | null; // legacy; not used for owner resolution now
};

type StatusDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  rarity?: string | null;

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

type ClaimOrderDoc = {
  id: number | string;
  landPlotId?: number | string | null;
  nextLandPlotId?: number | string | null;
};

type NftOwnerDoc = {
  id: number | string;
  nftId?: string | null; // varchar; equals NftIndexes.name
  wallet?: string | null; // wallet address
};

type WalletDoc = {
  id: number | string;
  address?: string | null;
  owner?: string | null; // display label
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
function isoMax(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}
function diffHumanFromPast(nowISO: string, thenISO: string): { rel: string; abs: string } {
  const now = Date.parse(nowISO);
  const then = Date.parse(thenISO);
  if (!Number.isFinite(now) || !Number.isFinite(then)) return { rel: "—", abs: thenISO };
  const ms = Math.max(0, now - then);
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const rel =
    day > 0 ? `${day}d ${hr % 24}h ago`
    : hr > 0 ? `${hr}h ${min % 60}m ago`
    : min > 0 ? `${min}m ${sec % 60}s ago`
    : `${sec}s ago`;
  return { rel, abs: new Date(then).toISOString() };
}
function diffHumanUntilFuture(nowISO: string, futureISO: string): { rel: string; abs: string } {
  const now = Date.parse(nowISO);
  const fut = Date.parse(futureISO);
  if (!Number.isFinite(now) || !Number.isFinite(fut)) return { rel: "—", abs: futureISO };
  const ms = Math.max(0, fut - now);
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const rel =
    day > 0 ? `in ${day}d ${hr % 24}h`
    : hr > 0 ? `in ${hr}h ${min % 60}m`
    : min > 0 ? `in ${min}m ${sec % 60}s`
    : `in ${sec}s`;
  return { rel, abs: new Date(fut).toISOString() };
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
function getIdFromProps(props: unknown): string | null {
  if (!props || typeof props !== "object") return null;
  const maybeParams = (props as { params?: unknown }).params;
  if (!maybeParams || typeof maybeParams !== "object") return null;
  const idRaw = (maybeParams as { id?: unknown }).id;
  return typeof idRaw === "string" ? idRaw : null;
}

// ---------- CMS fetchers ----------
async function fetchResourceByResourceId(actorDiscordId: string, rid: number): Promise<ResourceDoc | null> {
  const qs = new URLSearchParams({
    limit: "1",
    depth: "0",
    "where[resourceId][equals]": String(rid),
  }).toString();
  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<ResourceDoc>>(
    actorDiscordId,
    `/api/resources?${qs}`,
    { method: "GET" }
  );
  const docs = res?.docs ?? [];
  return docs.length > 0 ? docs[0] : null;
}

async function fetchResourceIdsBySize(actorDiscordId: string, size: string): Promise<number[]> {
  const out: number[] = [];
  if (!size.trim()) return out;

  const qs = new URLSearchParams({
    limit: "10000",
    depth: "0",
    "where[size][equals]": size,
  }).toString();
  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<ResourceDoc>>(
    actorDiscordId,
    `/api/resources?${qs}`,
    { method: "GET" }
  );
  for (const d of res?.docs ?? []) {
    const rid = toInt((d as { resourceId?: unknown }).resourceId ?? null);
    if (rid !== null) out.push(rid);
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
    for (const d of res?.docs ?? []) if (d && typeof d === "object") out.push(d);
  }
  return out;
}

async function fetchNftIndexes(actorDiscordId: string, rid: number): Promise<NftIndexDoc[]> {
  const qs = new URLSearchParams({
    limit: "1000",
    depth: "0",
    "where[landPlotId][equals]": String(rid),
  }).toString();
  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<NftIndexDoc>>(
    actorDiscordId,
    `/api/nft-indexes?${qs}`,
    { method: "GET" }
  );
  return (res?.docs ?? []).filter((d): d is NftIndexDoc => !!d && typeof d === "object");
}

async function fetchMaxInsertedAt(actorDiscordId: string, rid: number): Promise<string | null> {
  const qs = new URLSearchParams({
    limit: "1",
    depth: "0",
    sort: "-insertedAt",
    "where[landPlotId][equals]": String(rid),
  }).toString();
  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<NftIndexDoc>>(
    actorDiscordId,
    `/api/nft-indexes?${qs}`,
    { method: "GET" }
  );
  const top = (res?.docs ?? [])[0];
  if (top && typeof top === "object") {
    const ins = s((top as NftIndexDoc).insertedAt ?? null);
    if (ins) return ins;
  }
  const all = await fetchNftIndexes(actorDiscordId, rid);
  let maxIso: string | null = null;
  for (const d of all) {
    const ins = s(d.insertedAt ?? null);
    maxIso = isoMax(maxIso, ins || null);
  }
  return maxIso;
}

async function fetchStatusesForPlot(actorDiscordId: string, rid: number): Promise<StatusDoc[]> {
  const qs = new URLSearchParams({
    limit: "1000",
    depth: "0",
    "where[landPlotId][equals]": String(rid),
  }).toString();
  const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<StatusDoc>>(
    actorDiscordId,
    `/api/statuses?${qs}`,
    { method: "GET" }
  );
  return (res?.docs ?? []).filter((d): d is StatusDoc => !!d && typeof d === "object");
}

// ---------- Owner resolution ----------
// Step A: names (from nft-indexes) -> wallet (from nft-owners where nftId == name)
async function fetchNftOwnersByNames(actorDiscordId: string, names: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>(); // name -> wallet
  const uniq = Array.from(new Set(names.filter((n) => typeof n === "string" && n.trim().length > 0)));
  if (uniq.length === 0) return out;

  const CHUNK = 100;
  for (let i = 0; i < uniq.length; i += CHUNK) {
    const chunk = uniq.slice(i, i + CHUNK);

    // Payload [in] uses comma-separated list; names MUST NOT contain commas.
    const qs = new URLSearchParams({ limit: "10000", depth: "0" });
    qs.set("where[nftId][in]", chunk.join(","));

    const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<NftOwnerDoc>>(
      actorDiscordId,
      `/api/nft-owners?${qs.toString()}`,
      { method: "GET" }
    );

    for (const d of res?.docs ?? []) {
      const nftId = s((d as { nftId?: unknown }).nftId ?? "");
      const wallet = s((d as { wallet?: unknown }).wallet ?? "");
      if (nftId) out.set(nftId, wallet);
    }
  }
  return out;
}

// Step B: wallet address -> label (from wallets.owner)
async function fetchWalletOwners(actorDiscordId: string, addresses: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>(); // address -> label
  const uniq = Array.from(new Set(addresses.filter((a) => typeof a === "string" && a.trim().length > 0)));
  if (uniq.length === 0) return out;

  const CHUNK = 200;
  for (let i = 0; i < uniq.length; i += CHUNK) {
    const chunk = uniq.slice(i, i + CHUNK);
    const qs = new URLSearchParams({ limit: "10000", depth: "0" });
    qs.set("where[address][in]", chunk.join(","));
    const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<WalletDoc>>(
      actorDiscordId,
      `/api/wallets?${qs.toString()}`,
      { method: "GET" }
    );
    for (const d of res?.docs ?? []) {
      const addr = s((d as { address?: unknown }).address ?? "");
      const owner = s((d as { owner?: unknown }).owner ?? "");
      if (addr) out.set(addr, owner);
    }
  }
  return out;
}

// ---------- Claim order (probe common slugs) ----------
const CLAIM_ORDER_SLUGS = ["/api/claim-orders", "/api/claimOrders", "/api/claim-order"] as const;

async function tryClaimOrderQuery<T extends ClaimOrderDoc>(
  actorDiscordId: string,
  path: string,
  where: Record<string, string>
): Promise<CmsList<T> | null> {
  try {
    const qs = new URLSearchParams({ limit: "1", depth: "0" });
    for (const [k, v] of Object.entries(where)) qs.set(`where[${k}][equals]`, v);
    const url = `${path}?${qs.toString()}`;
    const res = await cmsAuthedFetchJsonForDiscordUser<CmsList<T>>(actorDiscordId, url, { method: "GET" });
    return res ?? null;
  } catch (_e: unknown) {
    return null;
  }
}
async function fetchClaimOrderPrev(actorDiscordId: string, rid: number): Promise<number | null> {
  for (const slug of CLAIM_ORDER_SLUGS) {
    const res = await tryClaimOrderQuery<ClaimOrderDoc>(actorDiscordId, slug, { nextLandPlotId: String(rid) });
    const prev = res?.docs?.[0];
    const lid = prev?.landPlotId ?? null;
    const n = toInt(lid);
    if (n !== null) return n;
  }
  return null;
}
async function fetchClaimOrderNext(actorDiscordId: string, rid: number): Promise<number | null> {
  for (const slug of CLAIM_ORDER_SLUGS) {
    const res = await tryClaimOrderQuery<ClaimOrderDoc>(actorDiscordId, slug, { landPlotId: String(rid) });
    const next = res?.docs?.[0];
    const nid = next?.nextLandPlotId ?? null;
    const n = toInt(nid);
    if (n !== null) return n;
  }
  return null;
}

// ---------- Page ----------
export default async function Page(props: unknown) {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;
  if (!actorDiscordId) return notFound();

  const idStr = getIdFromProps(props);
  const resourceId = toInt(idStr);
  if (!resourceId) return notFound();

  // Step 1: fetch the resource first (we need Size to optimize subsequent queries)
  const resource = await fetchResourceByResourceId(actorDiscordId, resourceId);
  if (!resource) return notFound();
  const currentSize = s(resource.size ?? "");

  // Step 2: run the rest in parallel, using currentSize to limit the heavy work
  const [
    nftIndexes,
    statusesForPlot,
    prevId,
    nextId,
    maxInserted,
    sameSizeResourceIds,
  ] = await Promise.all([
    fetchNftIndexes(actorDiscordId, resourceId),
    fetchStatusesForPlot(actorDiscordId, resourceId),
    fetchClaimOrderPrev(actorDiscordId, resourceId),
    fetchClaimOrderNext(actorDiscordId, resourceId),
    fetchMaxInsertedAt(actorDiscordId, resourceId),
    fetchResourceIdsBySize(actorDiscordId, currentSize),
  ]);

  // Step 3: only pull statuses that belong to plots with the SAME Size (massive cut vs "all statuses")
  const sameSizeStatuses = await fetchStatusesForPlots(actorDiscordId, sameSizeResourceIds);

  // Cross-out set — composite keys "<size>|<index>" for SAME-SIZE plots only
  const takenKeys = new Set<string>();
  for (const st of sameSizeStatuses) {
    const lp = toInt((st as { landPlotId?: unknown }).landPlotId ?? null);
    const idx = getStatusIndex(st);
    if (lp === null || idx === null) continue;
    const key = `${currentSize}|${idx}`;
    takenKeys.add(key);
  }

  // ---------- Owner resolution: NAME -> wallet -> label ----------
  const names: string[] = [];
  for (const d of nftIndexes) {
    const nm = s((d as { name?: unknown }).name ?? "");
    if (nm) names.push(nm);
  }

  // A: get wallets per name
  const nameToWallet = await fetchNftOwnersByNames(actorDiscordId, names);

  // B: fetch labels for those wallets
  const walletAddresses = Array.from(new Set(Array.from(nameToWallet.values()).filter(Boolean)));
  const walletToLabel = await fetchWalletOwners(actorDiscordId, walletAddresses);

  // Build final mapping for client: name -> label OR wallet OR "Unknown"
  const ownerByName: Record<string, string> = {};
  for (const nm of names) {
    const wal = nameToWallet.get(nm) || "";
    const lbl = wal ? (walletToLabel.get(wal) || "").trim() : "";
    ownerByName[nm] = lbl || wal || "Unknown";
  }

  // Updated / Claim timers (plot-scoped)
  const nowISO = new Date().toISOString();
  const updated = maxInserted ? diffHumanFromPast(nowISO, maxInserted) : null;

  let nearestFutureISO: string | null = null;
  let anyPast = false;
  for (const st of statusesForPlot) {
    const iso = getStatusStartISO(st);
    if (!iso) continue;
    const t = Date.parse(iso);
    const now = Date.parse(nowISO);
    if (!Number.isFinite(t) || !Number.isFinite(now)) continue;
    if (t >= now) {
      if (!nearestFutureISO || t < Date.parse(nearestFutureISO)) nearestFutureISO = iso;
    } else {
      anyPast = true;
    }
  }

  const claim =
    nearestFutureISO
      ? diffHumanUntilFuture(nowISO, nearestFutureISO)
      : anyPast
      ? { rel: "Claimed", abs: "" }
      : { rel: "—", abs: "" };

  const hdr = {
    resourceId,
    sector: s(resource.sector),
    district: s(resource.district),
    houseNumber: s(resource.houseNumber),
    town: s(resource.town), // ✅ fixed: s is a function
    size: currentSize,
    updatedRel: updated?.rel ?? "",
    updatedAbs: updated?.abs ?? "",
    claimRel: claim.rel,
    claimAbs: claim.abs,
  };

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Land Plot Overview</h1>
        <Link className="underline" href="/admin">Back to Admin</Link>
      </div>

      <LandPlotOverviewClient
        header={hdr}
        nftIndexes={nftIndexes}
        takenKeys={Array.from(takenKeys)}
        prevId={prevId}
        nextId={nextId}
        ownerByName={ownerByName}
      />
    </section>
  );
}
