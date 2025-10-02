// FILE: apps/cms/src/collections/map/Maps.ts
// Language: TypeScript

import type { CollectionConfig, PayloadRequest, Where, FilterOptionsProps } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../../access/isCmsAdmin';
import { viewerRank } from '../../access/guards';

/** ---------- Narrowing helpers ---------- */

type IDLike = string | number | { id?: unknown };

function asId(input: unknown): string | undefined {
  if (typeof input === 'string') return input;
  if (typeof input === 'number') return String(input);
  if (input && typeof input === 'object' && 'id' in input) {
    const v = (input as { id?: unknown }).id;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

type RoleDoc = {
  id: string | number;
  fullEditorialAccess?: boolean;
  cmsAdmin?: boolean;
  rank?: number;
};

type ViewerLite = { discordId?: string; roleIds: string[] };

function getViewer(req: PayloadRequest): ViewerLite {
  const v = (req as unknown as { viewer?: unknown })?.viewer;
  const discordId =
    v && typeof v === 'object' && 'discordId' in v && typeof (v as { discordId?: unknown }).discordId === 'string'
      ? String((v as { discordId?: unknown }).discordId)
      : undefined;

  const roleIdsRaw =
    v && typeof v === 'object' && 'roleIds' in v ? (v as { roleIds?: unknown }).roleIds : undefined;

  const roleIds =
    Array.isArray(roleIdsRaw)
      ? roleIdsRaw.map((x) => (typeof x === 'string' ? x : String(x))).filter((x) => x.length > 0)
      : [];

  return { discordId, roleIds };
}

async function loadRoleContext(req: PayloadRequest, viewerRoleIds: string[]) {
  if (!viewerRoleIds.length) {
    return { matchingRoleDocIds: [] as string[], isFullEditor: false, isCmsAdmin: false, maxReadRank: 0 };
  }

  const rolesRes = await req.payload.find({
    collection: 'discordRoles',
    where: { roleId: { in: viewerRoleIds } },
    limit: 1000,
    depth: 0,
  });

  const docs = Array.isArray(rolesRes.docs) ? rolesRes.docs : [];
  const matchingRoleDocIds: string[] = [];
  let isFullEditor = false;
  let isCmsAdmin = false;
  let maxReadRank = 0;

  for (const r of docs as unknown[]) {
    const id = asId(r);
    if (id) matchingRoleDocIds.push(id);

    if (r && typeof r === 'object') {
      const fea = (r as Partial<RoleDoc>).fullEditorialAccess === true;
      const ca = (r as Partial<RoleDoc>).cmsAdmin === true;
      const rankVal = typeof (r as Partial<RoleDoc>).rank === 'number' ? (r as Partial<RoleDoc>).rank! : 0;

      if (fea) isFullEditor = true;
      if (ca) isCmsAdmin = true;
      if (rankVal > maxReadRank) maxReadRank = rankVal;
    }
  }

  return { matchingRoleDocIds, isFullEditor, isCmsAdmin, maxReadRank };
}

async function writableSubcategoryIds(req: PayloadRequest, matchingRoleDocIds: string[]): Promise<string[]> {
  if (!matchingRoleDocIds.length) return [];
  const subs = await req.payload.find({ collection: 'subcategories', where: {}, limit: 1000, depth: 0 });

  const subDocs = Array.isArray(subs.docs) ? subs.docs : [];
  const catIds = new Set<string>();
  for (const s of subDocs as unknown[]) {
    const cid = asId((s as { category?: unknown }).category);
    if (cid) catIds.add(cid);
  }

  const cats = catIds.size
    ? await req.payload.find({
        collection: 'categories',
        where: { id: { in: Array.from(catIds) } },
        limit: 1000,
        depth: 0,
      })
    : { docs: [] as unknown[] };

  const catDocs = Array.isArray(cats.docs) ? cats.docs : [];
  const catById = new Map<string, unknown>();
  for (const c of catDocs) {
    const id = asId(c);
    if (id) catById.set(id, c);
  }

  const result: string[] = [];
  for (const s of subDocs) {
    const inherit =
      !!(s && typeof s === 'object' && 'inheritWriteFromCategory' in s && (s as { inheritWriteFromCategory?: unknown })
        .inheritWriteFromCategory === true);

    const subAllowedRaw =
      s && typeof s === 'object' && 'allowedWriteRoles' in s ? (s as { allowedWriteRoles?: unknown }).allowedWriteRoles : [];

    const subAllowedIds: string[] = Array.isArray(subAllowedRaw)
      ? subAllowedRaw.map((x) => asId(x)).filter((x): x is string => typeof x === 'string')
      : [];

    let effectiveAllowed: string[] = subAllowedIds;

    if (inherit) {
      const cid = asId((s as { category?: unknown }).category);
      const c = cid ? catById.get(cid) : undefined;
      const catAllowedRaw =
        c && typeof c === 'object' && 'allowedWriteRoles' in c
          ? (c as { allowedWriteRoles?: unknown }).allowedWriteRoles
          : [];
      const catAllowedIds: string[] = Array.isArray(catAllowedRaw)
        ? catAllowedRaw.map((x) => asId(x)).filter((x): x is string => typeof x === 'string')
        : [];
      effectiveAllowed = catAllowedIds;
    }

    if (effectiveAllowed.length && effectiveAllowed.some((id) => matchingRoleDocIds.includes(id))) {
      const sid = asId(s);
      if (sid) result.push(sid);
    }
  }
  return result;
}

/** ---------- Slug helpers ---------- */

function toSlug(input: string): string {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function findUniqueSlug(req: PayloadRequest, base: string, currentId?: string): Promise<string> {
  let candidate = base || 'map';
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await req.payload.find({
      collection: 'maps',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
    });
    const hit = Array.isArray(existing.docs) ? existing.docs[0] : undefined;
    const hitId = hit ? asId(hit) : undefined;
    if (!hit || (currentId && hitId && hitId === currentId)) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

/** ---------- Maps Collection ---------- */

export const Maps: CollectionConfig = {
  slug: 'maps',
  admin: { useAsTitle: 'title', group: 'Map' },
  versions: { drafts: true },
  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      // CMS users see all
      if (req.user) return true;

      // Public / viewer logic mirrors Pages
      const { discordId, roleIds } = getViewer(req);
      const rank = await viewerRank(req);

      const { matchingRoleDocIds, isFullEditor, isCmsAdmin } = await loadRoleContext(req, roleIds || []);
      if (isFullEditor || isCmsAdmin) return true;

      const publishedByRank: Where = {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [
              { minRank: { less_than_equal: typeof rank === 'number' ? rank : 0 } },
              { minRank: { exists: false } },
              { minRank: { equals: null } },
            ],
          },
        ],
      };

      if (!discordId || !matchingRoleDocIds.length) return publishedByRank;

      const writableSubs = await writableSubcategoryIds(req, matchingRoleDocIds);

      const myDraftsWhere: Where =
        writableSubs.length > 0
          ? {
              and: [
                { _status: { equals: 'draft' } },
                { createdByDiscordId: { equals: discordId } },
                { subcategory: { in: writableSubs } },
              ],
            }
          : { id: { equals: '___no_match___' } };

      const combined: Where = { or: [publishedByRank, myDraftsWhere] };
      return combined;
    },
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        description: 'Pick the parent Category first.',
        position: 'sidebar',
      },
    },
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      required: true,
      admin: {
        description: 'Only subcategories from the chosen Category are shown.',
        position: 'sidebar',
      },
      // ✅ Return boolean | Where, never unknown
      filterOptions: (options: FilterOptionsProps<unknown>): boolean | Where => {
        const sd = (options?.siblingData ?? {}) as Record<string, unknown>;
        const cat = sd.category as IDLike | undefined;
        const catId = asId(cat);
        if (!catId) return true;
        const where: Where = { category: { equals: String(catId) } };
        return where;
      },
    },
    { name: 'excerpt', type: 'textarea' },
    { name: 'minRank', type: 'number', label: 'Minimum rank to read', defaultValue: 0, min: 0 },
    {
      name: 'createdByDiscordId',
      type: 'text',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Filled from web on create using Discord user id. Nullable for testing.',
        readOnly: true,
      },
    },
    {
      name: 'navHidden',
      type: 'checkbox',
      label: 'Hide in nav',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        const d = (data || {}) as Record<string, unknown>;
        const currentId = asId(originalDoc as unknown);
        const raw = (typeof d.slug === 'string' && d.slug.trim().length > 0 ? d.slug : String(d.title || '')) || 'map';
        let base = toSlug(raw);
        if (!base) base = 'map';
        d.slug = await findUniqueSlug(req, base, currentId);
        return d;
      },
    ],
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const d = (data || {}) as Record<string, unknown>;
        if (operation === 'update') {
          const prev = (originalDoc || {}) as Record<string, unknown>;
          if (typeof prev.createdByDiscordId === 'string') {
            d.createdByDiscordId = prev.createdByDiscordId;
          }
        }
        if (operation === 'create') {
          const v = getViewer(req);
          if (!d.createdByDiscordId && v.discordId) {
            d.createdByDiscordId = v.discordId;
          }
        }
        return d;
      },
    ],
  },
};

export default Maps;
