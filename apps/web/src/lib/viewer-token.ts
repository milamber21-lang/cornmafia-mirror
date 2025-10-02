// FILE: apps/web/src/lib/viewer-token.ts
// WEB: signs the short-lived HS256 viewer JWT used to call CMS securely.

import { SignJWT } from "jose";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export type RoleLite = { rank?: number; cmsAdmin?: boolean };

export type ViewerJwtPayload = {
  discordId?: string | null;
  rank: number;
  guildId?: string | null;
  roleIds?: string[];        // raw Discord role snowflakes (for CMS write access checks)
  roles?: RoleLite[];        // minimal roles array for CMS admin check
  ttlSeconds?: number;       // default: 300s
};

export async function signViewerToken(payload: ViewerJwtPayload): Promise<string> {
  const secret = new TextEncoder().encode(requireEnv("VIEWER_JWT_SECRET"));
  const ttl = payload.ttlSeconds ?? 300;

  // Only include roleIds if they are sane strings
  const roleIds = Array.isArray(payload.roleIds)
    ? payload.roleIds.filter((r) => typeof r === "string" && /^\d{5,25}$/.test(r))
    : undefined;

  // Map incoming roles to RoleLite and drop nulls. Ensure resulting array is RoleLite[]
  const roles = Array.isArray(payload.roles)
    ? (payload.roles
        .map((r): RoleLite | null =>
          r && typeof r === "object"
            ? { rank: typeof r.rank === "number" ? r.rank : undefined, cmsAdmin: r.cmsAdmin === true }
            : null
        )
        .filter((r): r is RoleLite => r !== null))
    : undefined;

  return await new SignJWT({
    sub: payload.discordId ?? undefined,
    rank: payload.rank,
    guildId: payload.guildId ?? undefined,
    roleIds,
    roles,                         // embed minimal roles array for CMS access checks
    aud: "cms",
    iss: "web",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secret);
}
