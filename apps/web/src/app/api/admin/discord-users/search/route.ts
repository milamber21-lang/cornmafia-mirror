// FILE: apps/web/src/app/api/admin/discord-users/search/route.ts
// Language: TypeScript

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";

type CmsDoc = {
  discordId: string;
  username: string;
  globalName?: string | null;
};

type CmsFindResp = {
  docs: CmsDoc[];
  totalDocs: number;
  page: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  nextPage?: number;
};

type SessionUser = {
  id?: string;
  discordId?: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || 20)));
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId = (session?.user as SessionUser | undefined)?.discordId ?? null;
  if (!actorDiscordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("page", String(page));
  qs.set("depth", "0");

  if (q.length > 0) {
    // Username/GlobalName like, or exact id
    qs.set("where[or][0][username][like]", q);
    qs.set("where[or][1][globalName][like]", q);
    qs.set("where[or][2][discordId][equals]", q);
  }

  try {
    const data = await cmsAuthedFetchJsonForDiscordUser<CmsFindResp>(
      actorDiscordId,
      `/api/discordUsers?${qs.toString()}`,
      { method: "GET" },
    );

    const items = (data?.docs ?? []).map((d) => ({
      discordId: d.discordId,
      username: d.username,
      globalName: d.globalName ?? null,
    }));

    return NextResponse.json({
      items,
      hasMore: Boolean(data?.hasNextPage),
      nextPage: data?.nextPage ?? (data?.hasNextPage ? page + 1 : undefined),
    });
  } catch {
    // keep admin UI responsive; empty list is acceptable fallback
    return NextResponse.json({ items: [], hasMore: false }, { status: 200 });
  }
}
