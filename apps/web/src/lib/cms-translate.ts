// FILE: apps/web/src/lib/cms-translate.ts
// Central translator: converts Payload CMS documents (Pages) into
// a stable, app-friendly view model. Update ONLY this file when CMS
// block shapes evolve.

export type Id = string;

/** ---- Lexical types (subset) ---- */
export type LexicalNode = {
  type: string;
  text?: string;
  tag?: string;
  listType?: "bullet" | "number";
  format?: number;
  fields?: { url?: string; newTab?: boolean } | null;
  children?: LexicalNode[];
};

export type LexicalRoot = { root: LexicalNode };
export type MaybeLexical = LexicalRoot | { root?: unknown } | null | undefined;

/** ---- Media subset ---- */
export type Media = {
  id?: Id;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

/** ---- View model blocks ---- */
export type VMBlock =
  | { type: "richText"; value: LexicalRoot }
  | { type: "imageWithCaption"; media?: Media | null; alt?: string | null; caption?: LexicalRoot | null }
  | { type: "image"; media?: Media | null; alt?: string | null; captionText?: string | null }
  | { type: "mediaText"; media?: Media | null; alt?: string | null; caption?: string | null; position?: "left" | "right" | "center"; widthPct?: number; body?: LexicalRoot | null };

/** ---- Type guards / utils ---- */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasKey<T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** ---- Lexical normalization ---- */
export function normalizeLexical(input: MaybeLexical): LexicalRoot | null {
  if (!input || !isObject(input)) return null;
  if (!hasKey(input, "root")) return null;
  const rootUnknown = (input as { root?: unknown }).root;
  if (!isObject(rootUnknown)) return null;
  return { root: rootUnknown as LexicalNode };
}

/** ---- Block translators (Payload -> VM) ---- */
function toNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function translateRichTextBlock(raw: Record<string, unknown>): VMBlock | null {
  const hasContent = hasKey(raw, "content");
  const hasBody = hasKey(raw, "body");
  const content = hasContent ? normalizeLexical(raw.content as MaybeLexical) : null;
  const body = hasBody ? normalizeLexical(raw.body as MaybeLexical) : null;
  const value = content ?? body;
  if (!value) return null;
  return { type: "richText", value };
}

function translateImageWithCaptionBlock(raw: Record<string, unknown>): VMBlock {
  const media = (raw.media as Media) ?? null;
  const alt = (raw.alt as string) ?? null;
  const caption = hasKey(raw, "caption") ? normalizeLexical(raw.caption as MaybeLexical) : null;
  return { type: "imageWithCaption", media, alt, caption };
}

function translateImageBlock(raw: Record<string, unknown>): VMBlock {
  const media = (raw.media as Media) ?? null;
  const alt = (raw.alt as string) ?? null;
  const captionText = (raw as { caption?: string }).caption ?? null;
  return { type: "image", media, alt, captionText };
}

function translateMediaTextBlock(raw: Record<string, unknown>): VMBlock {
  const media = (raw.media as Media) ?? null;
  const alt = (raw.alt as string) ?? null;
  const caption = (raw.caption as string) ?? null;
  const positionRaw = (raw as { mediaPosition?: string }).mediaPosition ?? "right";
  const position: "left" | "right" | "center" =
    positionRaw === "left" || positionRaw === "right" || positionRaw === "center" ? positionRaw : "right";
  const widthPct = Math.max(10, Math.min(90, toNumber((raw as { mediaWidth?: string | number }).mediaWidth ?? 40, 40)));

  // Prefer body, fallback content
  const body =
    (hasKey(raw, "body") ? normalizeLexical(raw.body as MaybeLexical) : null) ??
    (hasKey(raw, "content") ? normalizeLexical(raw.content as MaybeLexical) : null);

  return { type: "mediaText", media, alt, caption, position, widthPct, body };
}

/** Translate a Payload page's `blocks` (or legacy `content`) into VMBlocks. */
export function translateBlocks(input: unknown): VMBlock[] {
  const arr: unknown[] = Array.isArray(input) ? input : [];
  const out: VMBlock[] = [];

  for (const item of arr) {
    if (!isObject(item)) continue;
    const maybeBlockType = (item as { blockType?: unknown }).blockType;
    const type = typeof maybeBlockType === "string" ? maybeBlockType : "";

    switch (type) {
      case "richText": {
        const b = translateRichTextBlock(item);
        if (b) out.push(b);
        break;
      }
      case "imageWithCaption":
        out.push(translateImageWithCaptionBlock(item));
        break;
      case "image":
        out.push(translateImageBlock(item));
        break;
      case "mediaText":
        out.push(translateMediaTextBlock(item));
        break;
      // Extend here (gallery, videoEmbed, cta, ...)
      default:
        break;
    }
  }
  return out;
}

/** Page translator: tolerant to different payload field names. */
export function translatePage(payloadDoc: unknown): { title: string; blocks: VMBlock[] } | null {
  if (!isObject(payloadDoc)) return null;

  const titleUnknown =
    (payloadDoc as { title?: string | null }).title ??
    (payloadDoc as { slug?: string | null }).slug ??
    "Untitled";

  const blocksRaw =
    (payloadDoc as { blocks?: unknown[] }).blocks ??
    (payloadDoc as { content?: unknown[] }).content ??
    [];

  return {
    title: String(titleUnknown || "Untitled"),
    blocks: translateBlocks(blocksRaw),
  };
}
