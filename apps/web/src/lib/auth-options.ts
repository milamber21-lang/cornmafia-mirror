// FILE: apps/web/src/lib/auth-options.ts
// Language: TypeScript
// NextAuth configuration with secure cookies in production.

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, Session, User as NAUser, Account as NAAccount } from "next-auth";
import DiscordProvider, { type DiscordProfile } from "next-auth/providers/discord";
import { prisma } from "./prisma";

// ✅ FIXED: use "@/lib/..." (alias points to apps/web/src)
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";
import { getGuildMember } from "@/lib/discord-guild";

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  const bad = new Set(["replace_me", "dummy_client_id", "dummy_client_secret", ""]);
  if (!v || bad.has(v.trim())) throw new Error(`Missing required env: ${name}`);
  return v;
}

function avatarUrl(p: DiscordProfile): string | null {
  return p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : null;
}

// ---- Inline upsert (no new file needed) -------------------------------------
async function upsertDiscordUserOnLogin(params: {
  discordUserId: string;
  usernameFallback?: string | null;
  globalNameFallback?: string | null;
}) {
  const { discordUserId, usernameFallback, globalNameFallback } = params;

  // 1) Look up existing record by discordId
  const qs = new URLSearchParams({
    "where[discordId][equals]": discordUserId,
    limit: "1",
    depth: "0",
  }).toString();

  type DiscordUserDoc = {
    id: string;
    discordId: string;
  };

  const find = await cmsAuthedFetchJsonForDiscordUser<{ docs: DiscordUserDoc[] }>(
    discordUserId,
    `/api/discordUsers?${qs}`,
    { method: "GET" },
  );

  // 2) Enrich with guild state (if bot can see the member)
  let isMember = false;
  let roles: string[] = [];
  let joinedAt: string | null = null;

  const guildId = process.env.DISCORD_GUILD_ID;
  if (guildId) {
    try {
      const member = await getGuildMember(guildId, discordUserId);
      roles = Array.isArray(member.roles) ? member.roles : [];
      isMember = true;
      joinedAt = member.joined_at || null;
    } catch {
      // Not a guild member or no access; proceed gracefully
      isMember = false;
      roles = [];
      joinedAt = null;
    }
  }

  // 3) Build payload (minimal & schema-safe)
  const nowIso = new Date().toISOString();
  const payload = {
    discordId: discordUserId,
    username: usernameFallback || `user-${discordUserId}`,
    globalName: globalNameFallback || null,
    isMember,
    roles: roles.map((r) => ({ value: r })),
    joinedAt,
    lastLoginAt: nowIso,
  };

  // 4) Create or update via viewer-token auth (self-upsert)
  if (find?.docs?.[0]?.id) {
    const id = find.docs[0].id;
    await cmsAuthedFetchJsonForDiscordUser(
      discordUserId,
      `/api/discordUsers/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  } else {
    await cmsAuthedFetchJsonForDiscordUser(
      discordUserId,
      `/api/discordUsers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }
}
// -----------------------------------------------------------------------------

export function buildAuthOptions(): NextAuthOptions {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !(process.env.NEXTAUTH_URL || "").startsWith("https://")) {
    // Keep soft (don’t throw) if your current infra uses http behind a reverse proxy
    // throw new Error("In production, NEXTAUTH_URL must be an https:// URL");
  }

  return {
    adapter: PrismaAdapter(prisma),

    session: {
      strategy: "database",
      maxAge: 7 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },

    useSecureCookies: isProd,

    cookies: {
      sessionToken: {
        name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: isProd,
        },
      },
    },

    pages: { signIn: "/login" },

    providers: [
      DiscordProvider({
        clientId: getRequiredEnv("DISCORD_CLIENT_ID"),
        clientSecret: getRequiredEnv("DISCORD_CLIENT_SECRET"),
        authorization: { params: { scope: "identify" } },
        profile(profile: DiscordProfile) {
          const name = profile.global_name ?? profile.username ?? null;
          return { id: profile.id, name, email: null, image: avatarUrl(profile) };
        },
      }),
    ],

    callbacks: {
      async session({ session, user }: { session: Session; user: NAUser }) {
        const u = user as { id: string; discordId?: string | null };
        if (session.user) {
          (session.user as { id: string }).id = u.id;
          (session.user as { discordId?: string | null }).discordId = u.discordId ?? null;
        }
        return session;
      },
    },

    events: {
      async signIn({ user, account }: { user: NAUser; account?: NAAccount | null }) {
        // Keep existing prisma write of user.discordId
        if (account?.provider === "discord" && account.providerAccountId) {
          const existing = await prisma.user.findUnique({
            where: { id: user.id },
            select: { discordId: true },
          });
          if (!existing?.discordId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { discordId: account.providerAccountId },
            });
          }

          // NEW: Inline CMS upsert (best-effort, non-blocking)
          try {
            const discordId = account.providerAccountId;
            const usernameFallback = user.name ?? null;
            await upsertDiscordUserOnLogin({
              discordUserId: discordId,
              usernameFallback,
              globalNameFallback: usernameFallback,
            });
          } catch (err) {
            console.error("[signIn] discordUsers upsert failed:", err);
          }
        }
      },
    },
  };
}
