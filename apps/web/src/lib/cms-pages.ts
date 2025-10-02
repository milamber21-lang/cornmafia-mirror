//apps/web/src/lib/cms-pages.ts
import { cmsFetchJson } from "./cms";

export type PageDoc = {
  id: string;
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  /** If you have a plugin that stores pre-rendered HTML, we’ll use it first */
  contentHtml?: string | null;
  /** Otherwise we’ll try to render this (rich text / blocks / etc.) */
  content?: unknown;
  updatedAt?: string;
  createdAt?: string;
};

export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const qs = new URLSearchParams({
    "where[slug][equals]": slug,
    limit: "1",
    depth: "2",
  }).toString();

  const res = await cmsFetchJson<{ docs: PageDoc[] }>(`/api/pages?${qs}`);
  return res.docs?.[0] ?? null;
}
