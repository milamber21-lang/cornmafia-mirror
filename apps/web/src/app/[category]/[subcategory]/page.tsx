// FILE: apps/web/src/app/[category]/[subcategory]/page.tsx
import { notFound } from "next/navigation";
import { cmsFetchJson } from "@/lib/cms";

type Id = string;
type PL<T> = { docs: T[] };

type Category = { id: Id; slug: string; title?: string | null };
type Subcategory = { id: Id; slug: string; title?: string | null; category: Id | { id: Id } };
type PageItem = { id: Id; slug: string; title?: string | null };

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

async function getVisiblePages(subId: string): Promise<PageItem[]> {
  const qs = new URLSearchParams();
  qs.set("where[subcategory][equals]", subId);
  qs.set("where[_status][equals]", "published");
  qs.set("where[navHidden][not_equals]", "true");
  qs.set("limit", "200");
  qs.set("depth", "0");
  const res = await cmsFetchJson<PL<PageItem>>(`/api/pages?${qs.toString()}`);
  return res.docs || [];
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category: catSlug, subcategory: subSlug } = await params;

  const cat = await getCategoryBySlug(catSlug);
  if (!cat) return notFound();

  const sub = await getSubcategoryBySlugWithinCategory(subSlug, cat.id);
  if (!sub) return notFound();

  const pages = await getVisiblePages(sub.id);

  return (
    <section className="container">
      <h1>{sub.title || sub.slug}</h1>
      {pages.length ? (
        <ul style={{ marginTop: 12 }}>
          {pages.map((p) => (
            <li key={p.id}>
              <a href={`/${cat.slug}/${sub.slug}/${p.slug}`}>{p.title || p.slug}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No pages in this subcategory yet.</p>
      )}
    </section>
  );
}
