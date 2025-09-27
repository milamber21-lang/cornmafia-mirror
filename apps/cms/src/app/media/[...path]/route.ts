// FILE: apps/cms/src/app/media/[...path]/route.ts
// Language: TypeScript

import type { NextRequest } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_ROOT = process.env.MEDIA_ROOT || "/app/media";

// Prevent path traversal like ../
function safeJoin(root: string, rel: string): string {
  const norm = path.posix.normalize("/" + rel).replace(/^\/+/, "");
  const abs = path.join(root, norm);
  if (!abs.startsWith(root)) throw new Error("Invalid path");
  return abs;
}

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function serve(relPath: string): Promise<Response> {
  if (!relPath) return new Response("Not Found", { status: 404 });

  const abs = safeJoin(MEDIA_ROOT, relPath);
  try {
    const stat = await fsp.stat(abs);
    if (!stat.isFile()) return new Response("Not Found", { status: 404 });

    const ext = path.extname(abs).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    const stream = fs.createReadStream(abs);
    // Next accepts a Node Readable as a web stream in Response
    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-length": String(stat.size),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

export async function GET(_req: NextRequest, ctx: any): Promise<Response> {
  const rel = (ctx?.params?.path ?? []).join("/");
  return serve(rel);
}

export async function HEAD(_req: NextRequest, ctx: any): Promise<Response> {
  const rel = (ctx?.params?.path ?? []).join("/");
  const abs = safeJoin(MEDIA_ROOT, rel);
  try {
    const stat = await fsp.stat(abs);
    if (!stat.isFile()) return new Response(null, { status: 404 });
    const ext = path.extname(abs).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    return new Response(null, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-length": String(stat.size),
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
