// FILE: apps/web/src/app/[category]/page.tsx
import { notFound } from "next/navigation";
import { cmsFetchJson } from "@/lib/cms";

type Id = string;
type PL<T> = { docs: T[] };

type Category = { id: Id; slug: string; title?: string | null };
type Subcategory = { id: Id; slug: string; title?: string | null; navHidden?: boolean | null; category: Id | { id: Id } };

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const qs = new URLSearchParams();
  qs.set("where[slug][equals]", slug);
  qs.set("limit", "1");
  qs.set("depth", "0");
  const res = await cmsFetchJson<PL<Category>>(`/api/categories?${qs.toString()}`);
  return res.docs?.[0] ?? null;
}

async function getVisibleSubcategories(catId: string): Promise<Subcategory[]> {
  const qs = new URLSearchParams();
  qs.set("where[category][equals]", catId);
  qs.set("where[navHidden][not_equals]", "true");
  qs.set("limit", "200");
  qs.set("depth", "0");
  const res = await cmsFetchJson<PL<Subcategory>>(`/api/subcategories?${qs.toString()}`);
  return res.docs || [];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: catSlug } = await params;

  const cat = await getCategoryBySlug(catSlug);
  if (!cat) return notFound();

  const subs = await getVisibleSubcategories(cat.id);

  return (
    <section className="container">
      <h1>{cat.title || cat.slug}</h1>

      {subs.length ? (
        <ul style={{ marginTop: 12 }}>
          {subs.map((s) => (
            <li key={s.id}>
              <a href={`/${cat.slug}/${s.slug}`}>{s.title || s.slug}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No subcategories to show.</p>
      )}
    </section>
  );
}
