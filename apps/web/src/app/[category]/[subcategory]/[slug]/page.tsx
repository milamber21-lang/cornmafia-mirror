// FILE: apps/web/src/app/[category]/[subcategory]/[slug]/page.tsx
import { notFound } from "next/navigation";
import { cmsFetchJson } from "@/lib/cms";
import { translatePage } from "@/lib/cms-translate";
import RichText from "@/components/blocks/RichText";
import ImageWithCaption from "@/components/blocks/ImageWithCaption";
import MediaText from "@/components/blocks/MediaText";
import Image from "next/image";

type Id = string;
type PL<T> = { docs: T[] };

type Category = { id: Id; slug: string; title?: string | null };
type Subcategory = { id: Id; slug: string; title?: string | null; category: Id | { id: Id } };
type PageDoc = {
  id: Id;
  slug: string;
  title?: string | null;
  subcategory: Id | { id: Id };
  blocks?: unknown[];
  content?: unknown[];
};

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const qs = new URLSearchParams();
  qs.set("where[slug][equals]", slug);
  qs.set("limit", "1");
  qs.set("depth", "0");
  const res = await cmsFetchJson<PL<Category>>(`/api/categories?${qs.toString()}`);
  return res.docs?.[0] ?? null;
}

async function getSubcategoryBySlugWithinCategory(subSlug: string, catId: string): Promise<Subcategory | null> {
  const qs = new URLSearchParams();
  qs.set("where[slug][equals]", subSlug);
  qs.set("where[category][equals]", catId);
  qs.set("limit", "1");
  qs.set("depth", "0");
  const res = await cmsFetchJson<PL<Subcategory>>(`/api/subcategories?${qs.toString()}`);
  return res.docs?.[0] ?? null;
}

async function getPageBySlugWithinSubcategory(pageSlug: string, subId: string): Promise<PageDoc | null> {
  const qs = new URLSearchParams();
  qs.set("where[slug][equals]", pageSlug);
  qs.set("where[subcategory][equals]", subId);
  qs.set("where[_status][equals]", "published");
  qs.set("limit", "1");
  qs.set("depth", "2");
  const res = await cmsFetchJson<PL<PageDoc>>(`/api/pages?${qs.toString()}`);
  return res.docs?.[0] ?? null;
}

export default async function PageDetail({
  params,
}: {
  params: Promise<{ category: string; subcategory: string; slug: string }>;
}) {
  const { category: catSlug, subcategory: subSlug, slug: pageSlug } = await params;

  const cat = await getCategoryBySlug(catSlug);
  if (!cat) return notFound();

  const sub = await getSubcategoryBySlugWithinCategory(subSlug, cat.id);
  if (!sub) return notFound();

  const page = await getPageBySlugWithinSubcategory(pageSlug, sub.id);
  if (!page) return notFound();

  const vm = translatePage(page);
  if (!vm) return notFound();

  return (
    <section className="card">
      <h1>{vm.title}</h1>

      {vm.blocks.map((b, i) => {
        switch (b.type) {
          case "richText":
            return (
              <div key={i}>
                <RichText value={b.value} />
              </div>
            );
          case "imageWithCaption":
            return <ImageWithCaption key={i} media={b.media} alt={b.alt ?? undefined} caption={b.caption ?? undefined} />;
          case "mediaText":
            return (
              <MediaText
                key={i}
                media={b.media}
                alt={b.alt ?? undefined}
                caption={b.caption ?? undefined}
                position={b.position}
                widthPct={b.widthPct}
                body={b.body ?? undefined}
              />
            );
          case "image":
            return b.media?.url ? (
              <figure key={i} style={{ margin: "16px 0" }}>
                <Image
                  src={b.media.url}
                  alt={b.alt ?? b.media.alt ?? ""}
                  width={b.media.width || 1200}
                  height={b.media.height || 800}
                  style={{ width: "100%", height: "auto" }}
                />
                {b.captionText ? <figcaption className="muted" style={{ marginTop: 6 }}>{b.captionText}</figcaption> : null}
              </figure>
            ) : null;
          default:
            return null;
        }
      })}
    </section>
  );
}
