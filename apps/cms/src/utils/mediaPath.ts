// FILE: apps/cms/src/utils/mediaPath.ts
// Language: TypeScript

import path from "path";
import fs from "fs/promises";

export type MediaPathParts = {
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  userDiscordId?: string | null;
  shared?: boolean | null;
};

export const MEDIA_ROOT = "/app/media";

/**
 * Build the directory prefix for a media file, using:
 *   categorySlug/subcategorySlug/{userDiscordId | _shared}
 * Missing segments are normalized to "_uncat" / "_unsub" / "_shared".
 */
export function buildMediaPrefix(parts: MediaPathParts): string {
  const cat = (parts.categorySlug || "_uncat").trim();
  const sub = (parts.subcategorySlug || "_unsub").trim();

  const ownerSegment =
    parts.shared || !parts.userDiscordId ? "_shared" : String(parts.userDiscordId).trim();

  // Avoid path traversal & illegal chars
  const safe = (s: string) =>
    s.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+/, "").replace(/-+$/, "") || "_";

  return path.posix.join(safe(cat), safe(sub), safe(ownerSegment));
}

/**
 * Compute a new filename (with nested directories relative to staticDir).
 * `originalExt` should include leading dot.
 */
export function composeStoredFilename(prefix: string, randomBase: string, originalExt: string) {
  const base = `${randomBase}${originalExt.toLowerCase()}`;
  return path.posix.join(prefix, base);
}

/**
 * Move a file on disk (within MEDIA_ROOT), creating target dirs if needed.
 * Accepts relative (to MEDIA_ROOT) paths.
 */
export async function moveMediaFile(oldRel: string, newRel: string) {
  const oldAbs = path.join(MEDIA_ROOT, oldRel);
  const newAbs = path.join(MEDIA_ROOT, newRel);
  const newDir = path.dirname(newAbs);
  await fs.mkdir(newDir, { recursive: true });
  await fs.rename(oldAbs, newAbs);
}

/**
 * Extract the stored relative filename (with directories) from a Payload media doc.
 */
export function getStoredRelFilename(doc: { filename?: string; url?: string }): string | null {
  if (doc?.filename) return doc.filename as string;
  // Fallback: derive from URL if filename is missing (rare)
  if (doc?.url) {
    try {
      const u = new URL(doc.url, "http://local/");
      return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    } catch {
      /* noop */
    }
  }
  return null;
}
