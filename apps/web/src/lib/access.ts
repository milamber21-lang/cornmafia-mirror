// FILE: apps/web/src/lib/access.ts
// Access helpers used across the app (Phase 2 prep, no separate cm-bot service).
// - Computes effective numeric rank from CMS role index + live Discord member roles.

import { getDiscordRolesIndex, rankFromRoleIds } from "./discord-roles-index";
import { getMemberRoleIds } from "./discord-guild";

export async function getEffectiveRank(opts: {
  discordUserId?: string | null;
  isAuthenticated: boolean;
}): Promise<number> {
  const index = await getDiscordRolesIndex();

  // Base rank from defaults
  const base = opts.isAuthenticated
    ? index.authenticatedDefault?.rank ?? 0
    : index.publicDefault?.rank ?? 0;

  // Optional augmentation via live Discord roles (using bot token + guild env)
  let roleRank = 0;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (opts.discordUserId && guildId) {
    const roleIds = await getMemberRoleIds(guildId, opts.discordUserId);
    roleRank = rankFromRoleIds(roleIds, index);
  }

  return Math.max(base, roleRank);
}

export async function meetsMinRank(opts: {
  discordUserId?: string | null;
  isAuthenticated: boolean;
  minRank: number;
}): Promise<boolean> {
  const rank = await getEffectiveRank(opts);
  return rank >= opts.minRank;
}
