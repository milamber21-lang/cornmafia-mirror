// FILE: apps/web/src/components/Menu.tsx
// Server component: builds a role-aware menu model from the Nav global
// and renders it with MenuClient. Links: /[category]/[subcategory]/[slug].
// Supports both lucide icons and custom media icons.

import MenuClient from "./MenuClient";
import { cmsFetchJson } from "../lib/cms";
import { cmsAuthedFetchJsonForDiscordUser } from "../lib/cms-authed";

type Id = string;

type NavPageRef = { page?: Id | { id: Id } | null };
type NavSubRef = { id?: Id; subcategory?: Id | { id: Id } | null; pages?: NavPageRef[] | null };
type NavItem = { category?: Id | { id: Id } | null; hidden?: boolean | null; subcategories?: NavSubRef[] | null };
type NavGlobal = { items?: NavItem[] | null };

type MediaDoc = { id: Id; url?: string | null; filename?: string | null; mimeType?: string | null };

type IconDoc = {
  id: Id;
  key?: string | null;
  source?: 'lucide' | 'media' | null;
  lucideName?: string | null;
  iconMedia?: Id | MediaDoc | null;
};

type CategoryDoc = { id: Id; slug: string; title?: string | null };

type SubcategoryDoc = {
  id: Id;
  slug: string;
  title?: string | null;
  category: Id | { id: Id };
  iconKey?: Id | IconDoc | null;
};

type PageDoc = {
  id: Id;
  slug: string;
  title?: string | null;
  subcategory: Id | { id: Id };
  iconKey?: Id | IconDoc | null;
};

export type MenuModel = Array<{
  id: Id;
  title: string;
  columns: Array<{
    id: Id;
    title: string;
    seeAllHref: string;
    iconName?: string;          // lucide (PascalCase)
    iconUrl?: string;           // custom media URL
    pages: Array<{ title: string; href: string; iconName?: string; iconUrl?: string }>;
  }>;
}>;

function idOf(rel: unknown): string | undefined {
  if (typeof rel === "string" || typeof rel === "number") return String(rel);
  if (rel && typeof rel === "object") {
    const obj = rel as { id?: unknown };
    if (obj.id != null) return String(obj.id);
  }
  return undefined;
}

function toArray<T>(value: T[] | null | undefined): T[] { return Array.isArray(value) ? value : []; }

async function fetchJson<T>(path: string, discordUserId?: string): Promise<T> {
  return discordUserId ? cmsAuthedFetchJsonForDiscordUser<T>(discordUserId, path) : cmsFetchJson<T>(path);
}

function isTutorials(cat?: { slug?: string | null; title?: string | null }): boolean {
  const s = (cat?.slug || "").toLowerCase();
  const t = (cat?.title || "").toLowerCase();
  return s === "tutorials" || t.startsWith("tutorial");
}

function kebabToPascal(input: string): string {
  return input.split("-").filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}
function iconFromDoc(icon?: IconDoc | Id | null): { iconName?: string; iconUrl?: string } {
  if (!icon || typeof icon === "string") return {}; // cannot resolve by id-only
  const source = icon.source ?? 'lucide';
  if (source === 'media') {
    const media = icon.iconMedia;
    const url = typeof media === 'object' && media && 'url' in media ? (media as MediaDoc).url || undefined : undefined;
    return { iconUrl: url };
  }
  const kebab = (icon.lucideName || icon.key || "").trim();
  if (!kebab) return {};
  return { iconName: kebabToPascal(kebab) };
}

/**
 * Optional prop: pass the logged-in Discord user id so the CMS applies
 * role-based access (otherwise anonymous/rank=0 visibility is used).
 */
export default async function Menu(props: { discordUserId?: string } = {}) {
  const discordUserId = props.discordUserId;

  // 1) Pull curated structure from global (ids only)
  const nav = await fetchJson<NavGlobal>("/api/globals/nav?depth=0", discordUserId);
  const items = toArray(nav.items);

  // Gather referenced ids
  const catIds = new Set<Id>();
  const subIdsByCat = new Map<Id, Set<Id>>();
  const pageIdsBySub = new Map<Id, Set<Id>>();

  for (const it of items) {
    if (it?.hidden) continue;
    const catId = idOf(it?.category);
    if (!catId) continue;
    catIds.add(catId);

    for (const s of toArray<NavSubRef>(it?.subcategories)) {
      const subId = idOf(s?.subcategory);
      if (!subId) continue;
      if (!subIdsByCat.has(catId)) subIdsByCat.set(catId, new Set<Id>());
      subIdsByCat.get(catId)!.add(subId);

      for (const p of toArray<NavPageRef>(s?.pages ?? [])) {
        const pid = idOf(p?.page);
        if (!pid) continue;
        if (!pageIdsBySub.has(subId)) pageIdsBySub.set(subId, new Set<Id>());
        pageIdsBySub.get(subId)!.add(pid);
      }
    }
  }

  // 2) Categories
  const catsQ = new URLSearchParams();
  catsQ.set("limit", "1000");
  catsQ.set("where[navHidden][not_equals]", "true");
  if (catIds.size) catsQ.set("where[id][in]", Array.from(catIds).join(","));
  const catsRes = await fetchJson<{ docs: CategoryDoc[] }>(`/api/categories?${catsQ.toString()}`, discordUserId);
  const categories = (catsRes.docs || []).filter((c) => !isTutorials(c));
  const catMap = new Map(categories.map((c) => [String(c.id), c]));

  // 3) Subcategories (depth=1 to resolve iconKey + iconMedia)
  const allSubIds = Array.from(new Set(Array.from(subIdsByCat.values()).flatMap((s) => Array.from(s))));
  const subsQ = new URLSearchParams();
  subsQ.set("limit", "1000");
  subsQ.set("depth", "1");
  subsQ.set("where[navHidden][not_equals]", "true");
  if (allSubIds.length) subsQ.set("where[id][in]", allSubIds.join(","));
  const subsRes = await fetchJson<{ docs: SubcategoryDoc[] }>(`/api/subcategories?${subsQ.toString()}`, discordUserId);
  const subMap = new Map((subsRes.docs || []).map((s) => [String(s.id), s]));

  // 4) Pages (depth=1 for iconKey + iconMedia)
  const allPageIds = Array.from(new Set(Array.from(pageIdsBySub.values()).flatMap((s) => Array.from(s))));
  const pageMap = new Map<string, PageDoc>();
  if (allPageIds.length) {
    const batchSize = 200;
    for (let i = 0; i < allPageIds.length; i += batchSize) {
      const ids = allPageIds.slice(i, i + batchSize);
      const q = new URLSearchParams();
      q.set("limit", String(ids.length));
      q.set("depth", "1");
      q.set("where[_status][equals]", "published");
      q.set("where[navHidden][not_equals]", "true");
      q.set("where[id][in]", ids.join(","));
      const r = await fetchJson<{ docs: PageDoc[] }>(`/api/pages?${q.toString()}`, discordUserId);
      (r.docs || []).forEach((pg) => pageMap.set(String(pg.id), pg));
    }
  }

  // 5) Assemble model
  const model: MenuModel = [];
  for (const it of items) {
    if (it?.hidden) continue;
    const catId = idOf(it?.category);
    if (!catId) continue;
    const cat = catMap.get(catId);
    if (!cat || isTutorials(cat)) continue;

    const columns: MenuModel[number]["columns"] = [];
    const subIds = Array.from(subIdsByCat.get(catId) || []);
    for (const subId of subIds) {
      const sub = subMap.get(subId);
      if (!sub) continue;
      const subCatId = idOf(sub.category);
      if (String(subCatId) !== String(catId)) continue;

      const wanted = Array.from(pageIdsBySub.get(subId) || []);
      const pagesForCol = wanted
        .map((id) => pageMap.get(id))
        .filter((v): v is PageDoc => Boolean(v));

      const seeAllHref = `/${cat.slug}/${sub.slug}`;
      const subIcon = iconFromDoc(typeof sub.iconKey === 'object' ? (sub.iconKey as IconDoc) : undefined);

      const col = {
        id: String(sub.id),
        title: sub.title || sub.slug,
        seeAllHref,
        iconName: subIcon.iconName,
        iconUrl: subIcon.iconUrl,
        pages: pagesForCol.map((pg) => {
          const pgIcon = iconFromDoc(typeof pg.iconKey === 'object' ? (pg.iconKey as IconDoc) : undefined);
          return {
            title: pg.title || pg.slug,
            href: `/${cat.slug}/${sub.slug}/${pg.slug}`,
            iconName: pgIcon.iconName,
            iconUrl: pgIcon.iconUrl,
          };
        }),
      };
      columns.push(col);
    }

    model.push({
      id: String(cat.id),
      title: cat.title || cat.slug,
      columns,
    });
  }

  return (
    <div className="menu">
      <div className="container menu-inner">
        <MenuClient model={model} />
      </div>
    </div>
  );
}
