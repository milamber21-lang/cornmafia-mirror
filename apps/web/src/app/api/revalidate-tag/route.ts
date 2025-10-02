// FILE: apps/web/src/app/api/revalidate-tag/route.ts
// Language: TypeScript

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * Secure endpoint to purge cached aggregates by tag.
 * Usage (POST or GET):
 *   /api/revalidate-tag?secret=...&tag=agg:sector:Solace-1
 *   /api/revalidate-tag?secret=...&tag=agg:district:Solace-1:District-1
 *   /api/revalidate-tag?secret=...&tag=agg:all
 *
 * Set env: REVALIDATE_TOKEN=<long random string>
 */

function readParam(url: URL, name: string): string {
  const v = url.searchParams.get(name);
  return typeof v === "string" ? v : "";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = readParam(url, "secret");
  const tag = readParam(url, "tag").trim();

  const expected = process.env.REVALIDATE_TOKEN || "";
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!tag) {
    return NextResponse.json({ ok: false, error: "Missing tag" }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ ok: true, revalidated: tag }, { status: 200 });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = readParam(url, "secret");
  const expected = process.env.REVALIDATE_TOKEN || "";
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let bodyTag: string | null = null;
  try {
    const json = (await req.json()) as unknown;
    if (json && typeof json === "object") {
      const t = (json as { tag?: unknown }).tag;
      if (typeof t === "string") bodyTag = t.trim();
    }
  } catch {
    // ignore
  }

  const tag = bodyTag || new URL(req.url).searchParams.get("tag") || "";
  if (!tag) {
    return NextResponse.json({ ok: false, error: "Missing tag" }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ ok: true, revalidated: tag }, { status: 200 });
}
