// FILE: apps/web/src/app/api/me/roles/route.ts
// Returns roles for the signed-in user + computed effective rank.
// Used by: apps/web/src/app/login/LoginClient.tsx

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import { getDiscordRolesIndex, rankFromRoleIds } from "@/lib/discord-roles-index";
import { getGuildRoles, getMemberRoleIds, colorIntToHex } from "@/lib/discord-guild";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(buildAuthOptions());
    const user = session?.user as { discordId?: string | null } | null;

    if (!user?.discordId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !botToken) {
      return NextResponse.json(
        { ok: false, error: "Discord env not configured (DISCORD_GUILD_ID / DISCORD_BOT_TOKEN)" },
        { status: 500 }
      );
    }

    // Fetch guild roles list and the member's role IDs
    const [allRoles, roleIds, index] = await Promise.all([
      getGuildRoles(guildId),                // Discord list of all roles (names, colors, etc.)
      getMemberRoleIds(guildId, user.discordId), // Discord member's role IDs (may be empty)
      getDiscordRolesIndex(),               // CMS role index (for rank mapping & defaults)
    ]);

    // Compute effective numeric rank
    const rank = Math.max(
      index.authenticatedDefault?.rank ?? 0,
      rankFromRoleIds(roleIds, index)
    );

    // Build a friendly roles array for the client (names/colors from Discord)
    const rolesDetailed = roleIds
      .map((id) => allRoles.find((r) => r.id === id))
      .filter(Boolean)
      .map((r) => ({
        id: r!.id,
        name: r!.name,
        source: "discord" as const,
        roleId: r!.id,
        colorHex: colorIntToHex(r!.color),
        // We intentionally omit per-role rank (varies by your CMS mapping);
        // the client only needs the overall computed rank above.
      }));

    return NextResponse.json({
      ok: true,
      roleIds,
      rank,
      roles: rolesDetailed,
      defaults: {
        public: index.publicDefault
          ? {
              id: String(index.publicDefault.id ?? "public"),
              name: index.publicDefault.name ?? "Public",
              source: "virtual",
              rank: index.publicDefault.rank ?? 0,
              isPublicDefault: true,
            }
          : null,
        authenticated: index.authenticatedDefault
          ? {
            id: String(index.authenticatedDefault.id ?? "authenticated"),
            name: index.authenticatedDefault.name ?? "Authenticated",
            source: "virtual",
            rank: index.authenticatedDefault.rank ?? 0,
            isAuthenticatedDefault: true,
          }
          : null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
