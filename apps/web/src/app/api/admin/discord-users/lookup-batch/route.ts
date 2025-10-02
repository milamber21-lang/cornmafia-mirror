// FILE: apps/web/src/app/api/admin/discord-users/lookup-batch/route.ts
// Language: TypeScript

import { NextRequest, NextResponse } from "next/server";

/**
 * Batch username lookup for Discord IDs.
 * Accepts: { ids: string[] }
 * Returns: { map: Record<string, string> }  // id -> username (or globalName, or id fallback)
 *
 * Internally fans out to the existing /api/admin/discord-users/search?q=<id>&limit=1
 * to avoid client-side N requests.
 */

type SearchResp = {
  items?: Array<{ discordId?: string; id?: string; username?: string; globalName?: string | null }>;
};

export async function POST(req: NextRequest) {
  let ids: string[] = [];
  try {
    const body = (await req.json()) as unknown;
    if (body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).ids)) {
      ids = ((body as Record<string, unknown>).ids as unknown[]).map((x) => (typeof x === "string" ? x : String(x ?? ""))).filter(Boolean);
    }
  } catch {
    // ignore; ids stays empty
  }

  if (ids.length === 0) {
    return NextResponse.json({ map: {} }, { status: 200 });
  }

  // Deduplicate to keep it efficient
  const unique = Array.from(new Set(ids));

  const out: Record<string, string> = {};
  await Promise.all(
    unique.map(async (id) => {
      try {
        const u = new URL("/api/admin/discord-users/search", req.url);
        u.searchParams.set("q", id);
        u.searchParams.set("limit", "1");
        const res = await fetch(u.toString(), {
          method: "GET",
          headers: { cookie: req.headers.get("cookie") ?? "" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as SearchResp;
        const hit = Array.isArray(data.items) ? data.items[0] : undefined;
        if (hit) {
          out[id] = (hit.username && String(hit.username)) || (hit.globalName && String(hit.globalName)) || id;
        }
      } catch {
        // ignore; fallback to id omitted -> client will show id or "—"
      }
    }),
  );

  return NextResponse.json({ map: out }, { status: 200 });
}
