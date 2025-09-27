// FILE: apps/web/src/app/api/admin/media/route.ts
// Language: TypeScript

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";

/** Media doc from CMS. Relations may be IDs (string|number) or populated objects. */
type MaybeRel =
  | string
  | number
  | { id?: string | number; name?: string; label?: string; title?: string; slug?: string }
  | null
  | undefined;

type MediaDoc = {
  id: string | number;
  alt?: string | null;
  category?: MaybeRel;
  subcategory?: MaybeRel;
  userDiscordId?: string | null;
  filename?: string | null;
  url?: string | null;
  mimeType?: string | null;
  mime_type?: string | null;
  shared?: boolean | null;
  filesize?: number | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

type CmsFindResp<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
  limit: number;
};

type DiscordUserDoc = {
  id: string | number;
  discordId: string;
  username?: string | null;
  globalName?: string | null;
};

type DiscordUsersFindResp = CmsFindResp<DiscordUserDoc>;

type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "NETWORK_UPSTREAM_FAILURE"
  | "NOT_FOUND"
  | "SERVER_ERROR";
  

function jsonError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function relId(v: MaybeRel): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const maybe = (v as { id?: unknown }).id;
    if (typeof maybe === "string" || typeof maybe === "number") return String(maybe);
  }
  return "";
}
function relName(v: MaybeRel): string {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  const o = v as Record<string, unknown>;
  return (
    (typeof o.name === "string" && o.name) ||
    (typeof o.label === "string" && o.label) ||
    (typeof o.title === "string" && o.title) ||
    (typeof o.slug === "string" && o.slug) ||
    (typeof o.id === "string" && o.id) ||
    ""
  );
}

/** Build a small username map from discordUsers collection (single server-side query). */
async function buildUsernameMap(actorDiscordId: string, ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {} as Record<string, { username?: string; globalName?: string }>;

  // Payload "in" query
  const qs = new URLSearchParams();
  qs.set("limit", String(unique.length));
  qs.set("depth", "0");
  qs.set("sort", "username");
  unique.forEach((id, idx) => {
    qs.set(`where[or][${idx}][discordId][equals]`, id);
  });

  try {
    const resp = await cmsAuthedFetchJsonForDiscordUser<DiscordUsersFindResp>(
      actorDiscordId,
      `/api/discordUsers?${qs.toString()}`,
      { method: "GET" },
    );
    const out: Record<string, { username?: string; globalName?: string }> = {};
    for (const u of resp?.docs ?? []) {
      if (!u?.discordId) continue;
      out[u.discordId] = { username: u.username ?? undefined, globalName: u.globalName ?? undefined };
    }
    return out;
  } catch {
    // Fail-soft: empty map (table will just show "—")
    return {};
  }
}

function withCache<T extends NextResponse>(r: T, seconds = 5) {
  // Tiny TTL to shave perceived latency; adjust or remove if not desired
  r.headers.set("Cache-Control", `public, max-age=${seconds}, s-maxage=${seconds * 6}`);
  return r;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId =
    (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;
  if (!actorDiscordId) {
    return jsonError("AUTH_REQUIRED", "Sign in required.", 401);
  }

  // ---- Meta helpers ----
  const meta = searchParams.get("meta");
  if (meta === "categories") {
    try {
      const resp = await cmsAuthedFetchJsonForDiscordUser<
        CmsFindResp<{ id: string | number; name?: string; label?: string; title?: string; slug?: string }>
      >(
        actorDiscordId,
        `/api/categories?${new URLSearchParams({ limit: "1000", depth: "0", sort: "name" }).toString()}`,
        { method: "GET" },
      );
      const items = (resp?.docs ?? []).map((c) => ({
        id: String(c.id),
        name: c.name || c.label || c.title || c.slug || String(c.id),
      }));
      return withCache(NextResponse.json({ items }), 300);
    } catch {
      return jsonError("NETWORK_UPSTREAM_FAILURE", "Failed to load categories.", 502);
    }
  }
  if (meta === "subcategories") {
    try {
      const resp = await cmsAuthedFetchJsonForDiscordUser<
        CmsFindResp<{ id: string | number; name?: string; label?: string; title?: string; slug?: string; category: string | number }>
      >(
        actorDiscordId,
        `/api/subcategories?${new URLSearchParams({ limit: "2000", depth: "0", sort: "name" }).toString()}`,
        { method: "GET" },
      );
      const items = (resp?.docs ?? []).map((s) => ({
        id: String(s.id),
        name: s.name || s.label || s.title || s.slug || String(s.id),
        category: String(s.category),
      }));
      return withCache(NextResponse.json({ items }), 300);
    } catch {
      return jsonError("NETWORK_UPSTREAM_FAILURE", "Failed to load subcategories.", 502);
    }
  }
  if (meta === "all") {
    try {
      const [cats, subs] = await Promise.all([
        cmsAuthedFetchJsonForDiscordUser<
          CmsFindResp<{ id: string | number; name?: string; label?: string; title?: string; slug?: string }>
        >(
          actorDiscordId,
          `/api/categories?${new URLSearchParams({ limit: "1000", depth: "0", sort: "name" }).toString()}`,
          { method: "GET" },
        ),
        cmsAuthedFetchJsonForDiscordUser<
          CmsFindResp<{ id: string | number; name?: string; label?: string; title?: string; slug?: string; category: string | number }>
        >(
          actorDiscordId,
          `/api/subcategories?${new URLSearchParams({ limit: "2000", depth: "0", sort: "name" }).toString()}`,
          { method: "GET" },
        ),
      ]);

      const categories = (cats?.docs ?? []).map((c) => ({
        id: String(c.id),
        name: c.name || c.label || c.title || c.slug || String(c.id),
      }));
      const subcategories = (subs?.docs ?? []).map((s) => ({
        id: String(s.id),
        name: s.name || s.label || s.title || s.slug || String(s.id),
        category: String(s.category),
      }));

      return withCache(NextResponse.json({ categories, subcategories }), 300);
    } catch {
      return jsonError("NETWORK_UPSTREAM_FAILURE", "Failed to load metadata.", 502);
    }
  }

  // ---- Detail ----
  const id = searchParams.get("id");
  if (id) {
    try {
      const item = await cmsAuthedFetchJsonForDiscordUser<MediaDoc>(
        actorDiscordId,
        `/api/media/${id}?depth=1`,
        { method: "GET" },
      );
      const mime =
        (typeof item.mimeType === "string" && item.mimeType) ||
        (typeof item.mime_type === "string" && item.mime_type) ||
        null;
      const sizeBytes =
        (typeof item.filesize === "number" && item.filesize) ||
        (typeof item.size === "number" && item.size) ||
        null;

      // Enrich owner username from CMS discordUsers
      const did = item.userDiscordId ?? null;
      let ownerUsername = "";
      let ownerGlobalName = "";
      if (did) {
        const map = await buildUsernameMap(actorDiscordId, [did]);
        ownerUsername = map[did]?.username ?? "";
        ownerGlobalName = map[did]?.globalName ?? "";
      }

      return NextResponse.json({
        item: {
          id: String(item.id),
          alt: item.alt ?? "",
          categoryId: relId(item.category),
          categoryName: relName(item.category),
          subcategoryId: relId(item.subcategory),
          subcategoryName: relName(item.subcategory),
          userDiscordId: item.userDiscordId ?? null,
          ownerUsername,
          ownerGlobalName,
          filename: item.filename ?? null,
          url: item.url ?? null,
          mimeType: mime,
          sizeBytes,
          width: item.width ?? null,
          height: item.height ?? null,
          createdAt: item.createdAt ?? null,
          updatedAt: item.updatedAt ?? null,
          shared: typeof item.shared === "boolean" ? item.shared : null,
        },
      });
    } catch {
      return jsonError("NOT_FOUND", "Media item not found.", 404);
    }
  }

  // ---- Listing with filters ----
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || 20)));
  const cat = (searchParams.get("cat") || "").trim(); // ID
  const sub = (searchParams.get("sub") || "").trim(); // ID
  const q = (searchParams.get("q") || "").trim();

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("depth", "1"); // populate relations for names; set to 0 if you denormalize
  qs.set("sort", "-updatedAt");

  // Flexible OR query for alt/filename + (optional) username→discordId mapping
  let orIndex = 0;
  if (q.length > 0) {
    qs.set(`where[or][${orIndex}][alt][like]`, q); orIndex++;
    qs.set(`where[or][${orIndex}][filename][like]`, q); orIndex++;
    // We could map username->discordId here too by querying discordUsers,
    // but since we enrich on the server anyway, client-side free text will still hit via alt/filename.
    // If you *do* want username text to match here, add:
    // - query discordUsers with q and OR their discordIds into where[userDiscordId][equals]
  }

  if (cat) qs.set("where[category][equals]", cat);
  if (sub) qs.set("where[subcategory][equals]", sub);

  try {
    const data = await cmsAuthedFetchJsonForDiscordUser<CmsFindResp<MediaDoc>>(
      actorDiscordId,
      `/api/media?${qs.toString()}`,
      { method: "GET" },
    );

    // Build username map for the page in one go
    const pageDiscordIds = Array.from(
      new Set((data?.docs ?? []).map((d) => d.userDiscordId || "").filter(Boolean) as string[])
    );
    const usernameMap = await buildUsernameMap(actorDiscordId, pageDiscordIds);

    const items = (data?.docs ?? []).map((d) => {
      const mime =
        (typeof d.mimeType === "string" && d.mimeType) ||
        (typeof d.mime_type === "string" && d.mime_type) ||
        null;
      const sizeBytes =
        (typeof d.filesize === "number" && d.filesize) ||
        (typeof d.size === "number" && d.size) ||
        null;

      const did = d.userDiscordId ?? "";
      const enriched = usernameMap[did] || {};
      const ownerUsername = (enriched.username || enriched.globalName || "").trim();

      return {
        id: String(d.id),
        alt: d.alt ?? "",
        categoryId: relId(d.category),
        categoryName: relName(d.category),
        subcategoryId: relId(d.subcategory),
        subcategoryName: relName(d.subcategory),
        userDiscordId: d.userDiscordId ?? null,
        ownerUsername,
        filename: d.filename ?? null,
        url: d.url ?? null,
        mimeType: mime,
        sizeBytes,
        width: d.width ?? null,
        height: d.height ?? null,
        createdAt: d.createdAt ?? null,
        updatedAt: d.updatedAt ?? null,
        shared: typeof d.shared === "boolean" ? d.shared : null,
      };
    });

    return withCache(
      NextResponse.json({
        items,
        page: data?.page ?? page,
        limit: data?.limit ?? limit,
        totalPages: data?.totalPages ?? 1,
        totalDocs: data?.totalDocs ?? items.length,
      }),
      5,
    );
  } catch {
    // Keep the admin UI responsive; empty list is acceptable fallback
    return NextResponse.json({ items: [], page: 1, limit, totalPages: 1, totalDocs: 0 });
  }
}
