// FILE: apps/web/src/lib/authz.ts
/**
 * Authorization helpers for admin area.
 * - KEEP: requireCmsAdmin() (Admin only)
 * - KEEP: requireEditor() (Editor only)
 * - KEEP: requireAdminOrEditor() (either Admin or Editor)
 *
 * Deny cases should be handled by callers (usually returning notFound()).
 */

import { getServerSession } from "next-auth";
import { buildAuthOptions } from "./auth-options";
import { getDiscordRolesIndex } from "./discord-roles-index";
import { getMemberRoleIds } from "./discord-guild";

type GuardResult =
  | { allowed: true }
  | { allowed: false; reason: "not-authenticated" | "not-cms-admin" | "not-editor" | "not-admin-or-editor" };

/** Admin = has a role with cmsAdmin: true */
export async function requireCmsAdmin(_request: Request): Promise<GuardResult> {
  const session = await getServerSession(buildAuthOptions());
  const user = session?.user as { discordId?: string | null } | null;
  if (!user) return { allowed: false, reason: "not-authenticated" };

  const index = await getDiscordRolesIndex();
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleIds = guildId && user.discordId ? await getMemberRoleIds(guildId, user.discordId) : [];

  const isCmsAdmin = roleIds.some((rid) => index.byRoleId[rid]?.cmsAdmin === true);
  return isCmsAdmin ? { allowed: true } : { allowed: false, reason: "not-cms-admin" };
}

/** Editor = has a role with fullEditorialAccess: true */
export async function requireEditor(_request: Request): Promise<GuardResult> {
  const session = await getServerSession(buildAuthOptions());
  const user = session?.user as { discordId?: string | null } | null;
  if (!user) return { allowed: false, reason: "not-authenticated" };

  const index = await getDiscordRolesIndex();
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleIds = guildId && user.discordId ? await getMemberRoleIds(guildId, user.discordId) : [];

  const isEditor = roleIds.some((rid) => index.byRoleId[rid]?.fullEditorialAccess === true);
  return isEditor ? { allowed: true } : { allowed: false, reason: "not-editor" };
}

/** Either Admin OR Editor */
export async function requireAdminOrEditor(request: Request): Promise<GuardResult> {
  const admin = await requireCmsAdmin(request);
  if (admin.allowed) return admin;

  const editor = await requireEditor(request);
  if (editor.allowed) return editor;

  return { allowed: false, reason: "not-admin-or-editor" };
}
