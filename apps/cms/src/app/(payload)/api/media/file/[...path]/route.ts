// Minimal, type-safe enough to avoid Next/TS signature complaints.
import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";

// IMPORTANT: keep this absolute path in sync with upload.staticDir
const STATIC_ROOT = "/app/media";

export async function GET(_req: Request, ctx: any) {
  try {
    const segments: string[] = Array.isArray(ctx?.params?.path)
      ? ctx.params.path
      : [];

    // The admin UI URL-encodes slashes; Next gives us them as segments already.
    // Build the relative path under /app/media:
    const rel = segments.join("/"); // e.g. `1/1/_shared/right_looking_mafia.svg`

    // Resolve and guard against path traversal
    const abs = path.posix.join(STATIC_ROOT, rel);
    const rooted = abs.startsWith(STATIC_ROOT + "/") || abs === STATIC_ROOT;
    if (!rooted) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // 404 if not there
    await stat(abs).catch(() => { throw new Error("ENOENT"); });

    // Stream the file
    const stream = createReadStream(abs);
    // Let Next infer content-type; for SVG it will be image/svg+xml
    return new Response(stream as any);
  } catch (e: any) {
    const code = e?.message === "ENOENT" ? 404 : 500;
    const message = code === 404 ? "Not Found" : "Internal Server Error";
    return NextResponse.json({ message }, { status: code });
  }
}
