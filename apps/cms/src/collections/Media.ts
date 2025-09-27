// FILE: apps/cms/src/collections/Media.ts
// Language: TypeScript

import type { CollectionConfig } from "payload";
import path from "path";
import fs from "fs/promises";
import { buildMediaPrefix, moveMediaFile } from "../utils/mediaPath";
import { sanitizeSVGIfNeeded } from "../utils/svgSanitize";
import { mediaDebug } from "../utils/debug"; // ?? add this import

/** ---- tiny guards ---- */
function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function asStr(x: unknown): string | null {
  return typeof x === "string" ? x : null;
}
function toNumOrStr(x: unknown): number | string | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const t = x.trim();
    if (!t) return null;
    if (/^\d+$/.test(t)) return Number(t);
    return t;
  }
  return null;
}
function parseBool(x: unknown): boolean | null {
  if (typeof x === "boolean") return x;
  if (typeof x === "string") {
    const v = x.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return true;
    if (["false", "0", "no", "off"].includes(v)) return false;
  }
  if (typeof x === "number") return x === 1 ? true : x === 0 ? false : null;
  return null;
}
function header(req: unknown, name: string): string | null {
  const r = req as { headers?: unknown };
  const h = isObj(r.headers)
    ? Object.fromEntries(
        Object.entries(r.headers as Record<string, unknown>).map(([k, v]) => [k.toLowerCase(), v]),
      )
    : {};
  const raw = (h as Record<string, unknown>)[name.toLowerCase()];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return null;
}
function getQuery(req: unknown, key: string): string | null {
  const urlStr = asStr((req as { url?: unknown }).url);
  if (!urlStr) return null;
  try {
    return new URL(urlStr, "http://localhost").searchParams.get(key);
  } catch {
    return null;
  }
}

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  upload: {
    staticDir: "/app/media",
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/svg",
      "application/xml",
      "text/xml",
      "video/mp4",
      "video/webm",
    ],
    allowRestrictedFileTypes: true,
  },
  admin: {
    useAsTitle: "alt",
    defaultColumns: ["filename", "category", "subcategory", "userDiscordId", "shared", "updatedAt"],
    description: "Files are organized as: category/subcategory/{discordId|_shared}/filename",
  },
  fields: [
    { name: "category", type: "relationship", relationTo: "categories", required: false },
    {
      name: "subcategory",
      type: "relationship",
      relationTo: "subcategories",
      required: false,
      admin: {
        condition: (_: unknown, sib: unknown) => isObj(sib) && !!sib["category"],
      },
      filterOptions: ({ siblingData }) => {
        const sib = siblingData as Record<string, unknown>;
        const cat =
          (isObj(sib?.category) ? asStr((sib.category as Record<string, unknown>).id) : asStr(sib?.category)) ??
          undefined;
        if (!cat) return true;
        return { category: { equals: String(cat) } };
      },
    },
    { name: "userDiscordId", type: "text", required: false },
    { name: "shared", type: "checkbox", required: false, defaultValue: true },
    { name: "alt", type: "text", required: false },
    { name: "credit", type: "text", required: false },
    { name: "tags", type: "array", required: false, fields: [{ name: "value", type: "text" }] },
  ],
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (isObj(doc) && doc["filename"]) {
          const u = `/media/${String(doc["filename"])}`;
          if (!doc["url"]) (doc as Record<string, unknown>).url = u;
          if (!doc["thumbnailURL"]) (doc as Record<string, unknown>).thumbnailURL = u;
        }
        return doc;
      },
    ],

    /** Normalize BEFORE validation so relationships pass and shared/user are correct. */
    beforeValidate: [
      async ({ data, req }) => {
        const traceId = getQuery(req, "trace") || "no-trace";

        // --- shared: query > header > body > default true
        const qShared = parseBool(getQuery(req, "shared"));
        const hShared = parseBool(header(req, "x-media-shared"));
        const bShared = isObj(data) ? parseBool((data as Record<string, unknown>).shared) : null;
        const sharedFinal = (qShared ?? hShared ?? bShared ?? true) as boolean;

        if (isObj(data)) (data as Record<string, unknown>).shared = sharedFinal;

        // --- alt/cat/sub from body > header > query
        const hAlt = header(req, "x-media-alt");
        const hCat = header(req, "x-media-category");
        const hSub = header(req, "x-media-subcategory");
        const qAlt = getQuery(req, "alt");
        const qCat = getQuery(req, "category");
        const qSub = getQuery(req, "subcategory");

        if (isObj(data)) {
          if (!asStr((data as Record<string, unknown>).alt)) {
            (data as Record<string, unknown>).alt = hAlt ?? qAlt ?? "";
          }
          const bodyCat = isObj((data as Record<string, unknown>).category)
            ? (data as Record<string, unknown>).category && (data as Record<string, unknown>).category
            : (data as Record<string, unknown>).category;
          const bodySub = isObj((data as Record<string, unknown>).subcategory)
            ? (data as Record<string, unknown>).subcategory &&
              (data as Record<string, unknown>).subcategory
            : (data as Record<string, unknown>).subcategory;

          const catCoerced = toNumOrStr(
            (isObj(bodyCat) ? (bodyCat as Record<string, unknown>).id : bodyCat) ?? hCat ?? qCat,
          );
          const subCoerced = toNumOrStr(
            (isObj(bodySub) ? (bodySub as Record<string, unknown>).id : bodySub) ?? hSub ?? qSub,
          );
          if (catCoerced !== null) (data as Record<string, unknown>).category = catCoerced;
          if (subCoerced !== null) (data as Record<string, unknown>).subcategory = subCoerced;
        }

        // --- userDiscordId: query > headers > req.user (admin)
        const qUser = getQuery(req, "userDiscordId");
        const hUser =
          header(req, "x-actor-discord-id") ||
          header(req, "x-user-discord-id") ||
          header(req, "x-discord-id");
        let reqUser: string | null = null;
        if (isObj(req)) {
          const u = isObj((req as Record<string, unknown>).user)
            ? ((req as Record<string, unknown>).user as Record<string, unknown>)
            : null;
          reqUser = u && typeof u["discordId"] === "string" ? String(u["discordId"]) : null;
        }
        const finalUser = (qUser || hUser || reqUser || "").trim() || null;

        if (isObj(data)) {
          if (finalUser) (data as Record<string, unknown>).userDiscordId = finalUser;
        }

        // ?? was: console.log("[CMS preValidate normalized]", {...})
        mediaDebug("preValidate normalized", {
          traceId,
          alt: isObj(data) ? (asStr((data as Record<string, unknown>).alt) ?? null) : null,
          category: isObj(data) ? (data as Record<string, unknown>).category ?? null : null,
          subcategory: isObj(data) ? (data as Record<string, unknown>).subcategory ?? null : null,
          shared: isObj(data) ? (data as Record<string, unknown>).shared ?? null : null,
          userDiscordId: isObj(data) ? (asStr((data as Record<string, unknown>).userDiscordId) ?? null) : null,
          sources: {
            qShared,
            hShared,
            bShared,
            qCat,
            hCat,
            qSub,
            hSub,
            qUser,
            hUser: hUser || null,
            reqUser: reqUser || null,
          },
        });

        return data;
      },
    ],

    /** Compute filename with user folder when shared=false & userDiscordId present */
    beforeChange: [
      async ({ data, req }) => {
        if (!isObj(data)) return data;

        const incoming =
          asStr((data as Record<string, unknown>).filename) ||
          (isObj((data as Record<string, unknown>).file)
            ? asStr(((data as Record<string, unknown>).file as Record<string, unknown>).filename)
            : null) ||
          "";
        const basename = incoming ? path.posix.basename(incoming) : "";

        const cat = ((): string => {
          const c = (data as Record<string, unknown>).category;
          if (isObj(c)) {
            const id = asStr((c as Record<string, unknown>).id);
            return id ?? "_uncat";
          }
          const v = toNumOrStr(c);
          return v !== null ? String(v) : "_uncat";
        })();

        const sub = ((): string => {
          const s = (data as Record<string, unknown>).subcategory;
          if (isObj(s)) {
            const id = asStr((s as Record<string, unknown>).id);
            return id ?? "_unsub";
          }
          const v = toNumOrStr(s);
          return v !== null ? String(v) : "_unsub";
        })();

        const qShared = parseBool(getQuery(req, "shared"));
        const shared =
          typeof (data as Record<string, unknown>).shared === "boolean"
            ? ((data as Record<string, unknown>).shared as boolean)
            : (qShared ?? true);

        // final user id (same precedence as beforeValidate)
        const qUser = getQuery(req, "userDiscordId");
        const hUser =
          header(req, "x-actor-discord-id") ||
          header(req, "x-user-discord-id") ||
          header(req, "x-discord-id");
        let reqUser: string | null = null;
        if (isObj(req)) {
          const u = isObj((req as Record<string, unknown>).user)
            ? ((req as Record<string, unknown>).user as Record<string, unknown>)
            : null;
          reqUser = u && typeof u["discordId"] === "string" ? String(u["discordId"]) : null;
        }
        const userDiscordId =
          asStr((data as Record<string, unknown>).userDiscordId) ||
          qUser ||
          hUser ||
          reqUser ||
          null;

        const prefix = buildMediaPrefix({
          categorySlug: cat || "_uncat",
          subcategorySlug: sub || "_unsub",
          userDiscordId: !shared && userDiscordId ? userDiscordId : null,
          shared,
        });

        const traceId = getQuery(req, "trace") || "no-trace";

        // ?? was: console.log("[CMS beforeChange COMPUTE]", {...})
        mediaDebug("beforeChange COMPUTE", {
          traceId,
          incoming,
          basename,
          used: { categoryId: cat, subcategoryId: sub, shared, userDiscordId: userDiscordId ?? null },
          prefix,
        });

        if (!basename) return data;
        const desiredRel = path.posix.join(prefix, basename);
        if ((data as Record<string, unknown>).filename !== desiredRel) {
          (data as Record<string, unknown>).filename = desiredRel;
        }

        // ?? was: console.log("[CMS beforeChange FILENAME]", { traceId, desiredRel })
        mediaDebug("beforeChange FILENAME", { traceId, desiredRel });

        return data;
      },
    ],

    /** Move file and sanitize SVG */
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        const staticRoot = "/app/media";
        const desiredRel = String(isObj(doc) ? (doc as Record<string, unknown>)["filename"] ?? "" : "").trim();
        if (!desiredRel) return;

        const dstAbs = path.posix.join(staticRoot, desiredRel);
        try {
          await fs.access(dstAbs);
          await sanitizeSVGIfNeeded(desiredRel);
          return;
        } catch {}

        const prevRel = String(
          isObj(previousDoc) ? (previousDoc as Record<string, unknown>)["filename"] ?? "" : "",
        ).trim();
        if (operation === "update" && prevRel && prevRel !== desiredRel) {
          try {
            await moveMediaFile(prevRel, desiredRel);
            await sanitizeSVGIfNeeded(desiredRel);
            return;
          } catch {}
        }

        const basename = path.posix.basename(desiredRel);
        const srcRel = basename;
        const srcAbs = path.posix.join(staticRoot, srcRel);
        try {
          await fs.access(srcAbs);
          await moveMediaFile(srcRel, desiredRel);
        } catch {}

        await sanitizeSVGIfNeeded(desiredRel);
      },
    ],
  },
};
