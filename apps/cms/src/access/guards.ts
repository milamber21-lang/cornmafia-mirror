// apps/cms/src/access/guards.ts
import { jwtVerify } from "jose";

// read once; if not set we’ll treat as public
const SECRET = process.env.VIEWER_JWT_SECRET;

type Req = {
  get?: (name: string) => string | undefined;          // if running under express-like
  headers?: Record<string, unknown> | Headers | null;  // Next / Node
};

function readHeader(req: Req | undefined, name: string): string {
  if (!req) return "";
  // express-style
  const fromGet = req.get?.(name) || req.get?.(name.toLowerCase());
  if (fromGet) return String(fromGet);

  // Node object style
  const h = req.headers as Record<string, unknown>;
  const v =
    (h && (h[name] as string | string[] | undefined)) ??
    (h && (h[name.toLowerCase()] as string | string[] | undefined));
  if (Array.isArray(v)) return v[0] ?? "";
  if (typeof v === "string") return v;

  // WHATWG Headers
  if (typeof (req.headers as any)?.get === "function") {
    return (req.headers as any).get(name) || (req.headers as any).get(name.toLowerCase()) || "";
  }
  return "";
}

/** Securely derive viewer rank from X-Viewer-Token; 0 if missing/invalid. */
export async function viewerRank(req: Req | undefined): Promise<number> {
  const token = readHeader(req, "X-Viewer-Token");
  if (!token || !SECRET) return 0;
  try {
    const key = new TextEncoder().encode(SECRET);
    const { payload, protectedHeader } = await jwtVerify(token, key, {
      audience: "cms",
      issuer: "web",
      algorithms: ["HS256"],
    });
    if (protectedHeader?.alg !== "HS256") return 0;
    const r = (payload as any).rank;
    return typeof r === "number" ? r : 0;
  } catch {
    return 0;
  }
}
