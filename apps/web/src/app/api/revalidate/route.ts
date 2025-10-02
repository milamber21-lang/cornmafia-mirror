// FILE: apps/web/src/app/api/revalidate/route.ts
/**
 * Payload webhook endpoint to revalidate cache tags.
 * Accepts either:
 *  - { tag: "tokens" } OR
 *  - { collection: "themeTokens" } (mapped to a tag)
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const collectionToTag: Record<string, string> = {
  themeTokens: "tokens",
  icons: "icons",
  media: "media",
  nav: "nav",
  categories: "categories",
  subcategories: "subcategories",
  series: "series",
  templates: "templates",
  discordRoles: "discord-roles",
  pages: "pages",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let tag = body?.tag as string | undefined;

    if (!tag) {
      const col = String(body?.collection || "");
      tag = collectionToTag[col];
    }

    if (!tag) {
      return NextResponse.json({ ok: false, error: "No tag" }, { status: 400 });
    }

    revalidateTag(tag);
    return NextResponse.json({ ok: true, tag });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
