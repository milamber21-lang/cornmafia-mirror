// FILE: apps/web/src/lib/discord-roles-index.ts
// Builds an index of roles from the CMS and caches it for quick lookups.

import { cmsFetchJson } from "./cms";

type RoleSource = "discord" | "virtual";

export interface DiscordRoleDoc {
  id: string;                // CMS doc id
  name: string;
  source: RoleSource;        // 'discord' or 'virtual'
  roleId?: string | null;    // Discord role snowflake if source='discord'
  colorHex?: string | null;
  rank: number;              // power/points (you control this in CMS)
  isPublicDefault?: boolean;
  isAuthenticatedDefault?: boolean;

  // New fields we actually have in CMS and want to read:
  cmsAdmin?: boolean;
  fullEditorialAccess?: boolean;
}

interface FindResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage?: number;
}

export interface DiscordRolesIndex {
  byRoleId: Record<string, DiscordRoleDoc>;
  publicDefault?: DiscordRoleDoc;
  authenticatedDefault?: DiscordRoleDoc;
  fetchedAt: number;
}

/**
 * In-memory cache (per web process). TTL keeps things fresh without hammering CMS.
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache: { data?: DiscordRolesIndex; expiresAt: number } = { data: undefined, expiresAt: 0 };

export async function getDiscordRolesIndex(): Promise<DiscordRolesIndex> {
  const now = Date.now();
  if (cache.data && cache.expiresAt > now) return cache.data;

  // Fetch all roles (collection slug: 'discordRoles'; read access is true)
  // We request depth=0 to keep payload light; Payload returns all top-level fields.
  const data = await cmsFetchJson<FindResponse<DiscordRoleDoc>>(
    "/api/discordRoles?limit=500&depth=0"
  );

  const byRoleId: Record<string, DiscordRoleDoc> = {};
  let publicDefault: DiscordRoleDoc | undefined;
  let authenticatedDefault: DiscordRoleDoc | undefined;

  for (const doc of data.docs) {
    // Track defaults
    if (doc.isPublicDefault) publicDefault = doc;
    if (doc.isAuthenticatedDefault) authenticatedDefault = doc;

    // Index only real Discord roles by their Discord snowflake id
    if (doc.source === "discord" && doc.roleId) {
      byRoleId[doc.roleId] = doc;
    }
  }

  const index: DiscordRolesIndex = {
    byRoleId,
    publicDefault,
    authenticatedDefault,
    fetchedAt: now,
  };

  cache = { data: index, expiresAt: now + CACHE_TTL_MS };
  return index;
}

/** Compute the best (max) rank for a set of Discord role IDs. */
export function rankFromRoleIds(roleIds: string[], index: DiscordRolesIndex): number {
  if (!Array.isArray(roleIds) || roleIds.length === 0) return 0;
  let maxRank = 0;
  for (const id of roleIds) {
    const doc = index.byRoleId[id];
    if (doc && typeof doc.rank === "number") {
      if (doc.rank > maxRank) maxRank = doc.rank;
    }
  }
  return maxRank;
}
