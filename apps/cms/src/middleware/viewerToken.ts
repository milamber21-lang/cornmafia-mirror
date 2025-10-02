// FILE: apps/cms/src/middleware/viewerToken.ts
// Verifies short-lived HS256 "viewer" JWT from X-Viewer-Token and sets req.viewer.

import { jwtVerify, type JWTPayload } from "jose";

const SECRET = process.env.VIEWER_JWT_SECRET;

type Viewer = {
  discordId: string | null;
  rank: number;
  guildId: string | null;
  roleIds?: string[]; // NEW: raw Discord role snowflakes
  iat?: number;
  exp?: number;
};

type ReqWithViewer = {
  get(name: string): string | undefined;
  viewer?: Viewer;
} & Record<string, unknown>;

type Next = () => void;

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === "string");
}

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  if (!SECRET) return null;
  try {
    const key = new TextEncoder().encode(SECRET);
    const { payload, protectedHeader } = await jwtVerify(token, key, {
      audience: "cms",
      issuer: "web",
      algorithms: ["HS256"],
    });
    if (protectedHeader?.alg !== "HS256") return null;
    if (typeof (payload as any).rank !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

export function viewerTokenMiddleware() {
  return async function viewerToken(req: ReqWithViewer, _res: unknown, next: Next) {
    const token =
      (req.get?.("X-Viewer-Token") as string) ||
      (req.get?.("x-viewer-token") as string) ||
      "";

    if (!token) return next();

    const payload = await verifyJWT(token);
    if (payload) {
      const rawRoles = (payload as any).roleIds;
      req.viewer = {
        discordId: (payload.sub as string) ?? null,
        rank: (payload as any).rank as number,
        guildId: ((payload as any).guildId as string) ?? null,
        roleIds: isStringArray(rawRoles) ? rawRoles : undefined, // NEW
        iat: payload.iat,
        exp: payload.exp,
      };
    }
    next();
  };
}
