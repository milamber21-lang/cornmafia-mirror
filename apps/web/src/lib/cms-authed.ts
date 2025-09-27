// FILE: apps/web/src/lib/cms-authed.ts
import { signViewerToken, type RoleLite } from "./viewer-token";
import { getDiscordRolesIndex, rankFromRoleIds } from "./discord-roles-index";
import { fetchMemberRoleIds } from "./discord-guild";

const INTERNAL_URL = process.env.CMS_INTERNAL_URL;
const PUBLIC_URL = process.env.CMS_PUBLIC_URL;

function cmsBase(): string {
  const base = INTERNAL_URL || PUBLIC_URL;
  if (!base) throw new Error("CMS url not configured (CMS_INTERNAL_URL / CMS_PUBLIC_URL)");
  return base.replace(/\/+$/, "");
}

/**
 * Role-aware fetch for CMS writes.
 * - Looks up member's Discord roles
 * - Computes rank via CMS roles index
 * - Signs viewer token with BOTH roleIds, rank, and roles[] (with cmsAdmin flags)
 * - Sends as X-Viewer-Token
 */
export async function cmsAuthedFetchJsonForDiscordUser<T>(
  discordUserId: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = cmsBase();
  const url = `${base}/${path.replace(/^\/+/, "")}`;

  // 1) Guild roles (server-to-server)
  const roleIds = await fetchMemberRoleIds(discordUserId);

  // 2) Rank & roles[] from CMS role index
  const index = await getDiscordRolesIndex();
  const rank = rankFromRoleIds(roleIds, index);

  const rolesLite: RoleLite[] = roleIds
    .map((rid) => index.byRoleId[rid])
    .filter((doc): doc is NonNullable<typeof doc> => !!doc)
    .map((doc) => ({
      rank: typeof doc.rank === "number" ? doc.rank : undefined,
      cmsAdmin: doc.cmsAdmin === true, // this is what CMS checks in hasCmsAdminFromReq
    }));

  // 3) Sign viewer token with rank + roleIds + roles[]
  const token = await signViewerToken({
    discordId: discordUserId,
    guildId: process.env.DISCORD_GUILD_ID ?? null,
    roleIds,
    roles: rolesLite,   // NEW
    rank,
    ttlSeconds: 300,
  });

  const res = await fetch(url, {
    ...init,
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      "X-Viewer-Token": token,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CMS ${res.status} ${url} ${text}`);
  }
  return (await res.json()) as T;
}
