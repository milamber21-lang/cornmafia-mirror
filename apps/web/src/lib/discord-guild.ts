// FILE: apps/web/src/lib/discord-guild.ts
// Light Discord REST helpers used by the web app (no separate bot service).

const DISCORD_API = "https://discord.com/api/v10";

export type APIRole = {
  id: string;
  name: string;
  position: number;
  color: number; // integer RGB (0..16777215)
  hoist: boolean;
  managed: boolean;
  mentionable: boolean;
  permissions: string;
  icon?: string | null;
  unicode_emoji?: string | null;
  tags?: Record<string, unknown>;
  flags?: number;
};

export type APIGuildMember = {
  user?: { id: string; username: string; global_name?: string | null; avatar?: string | null };
  nick?: string | null;
  avatar?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf?: boolean;
  mute?: boolean;
  flags?: number;
  pending?: boolean;
  communication_disabled_until?: string | null;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set for cm-web`);
  return v;
}

async function discordGet<T>(path: string): Promise<T> {
  const token = requireEnv("DISCORD_BOT_TOKEN");
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord GET ${path} -> ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function getGuildRoles(guildId: string): Promise<APIRole[]> {
  return discordGet<APIRole[]>(`/guilds/${guildId}/roles`);
}

export async function getGuildMember(guildId: string, userId: string): Promise<APIGuildMember> {
  return discordGet<APIGuildMember>(`/guilds/${guildId}/members/${userId}`);
}

/**
 * Low-level: requires guildId. Returns [] on failure.
 */
export async function getMemberRoleIds(guildId: string, userId: string): Promise<string[]> {
  try {
    const m = await getGuildMember(guildId, userId);
    return m.roles ?? [];
  } catch {
    return [];
  }
}

/**
 * High-level convenience used by older callers:
 * Reads DISCORD_GUILD_ID from env and returns the member's role IDs.
 * This mirrors the previous project API name/behavior.
 */
export async function fetchMemberRoleIds(userId: string): Promise<string[]> {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return [];
  return getMemberRoleIds(guildId, userId);
}

/** Convert Discord int color to "#rrggbb" */
export function colorIntToHex(n: number | null | undefined): string | undefined {
  if (!n || n <= 0) return undefined;
  return `#${Number(n).toString(16).padStart(6, "0")}`;
}
