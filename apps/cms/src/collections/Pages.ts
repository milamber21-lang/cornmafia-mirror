// FILE: apps/cms/src/collections/Pages.ts
// Language: TypeScript

import type { CollectionConfig, PayloadRequest } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../access/isCmsAdmin';
import { iconColorField, iconKeyField } from '../fields/icon';
import { RichTextBlock } from '../blocks/RichText';
import { ImageBlock } from '../blocks/Image';
import { ImageWithCaption } from '../blocks/ImageWithCaption';
import { GalleryBlock } from '../blocks/Gallery';
import { MediaTextBlock } from '../blocks/MediaText';
import { VideoEmbedBlock } from '../blocks/VideoEmbed';
import { CTABlock } from '../blocks/CTA';
import { viewerRank } from '../access/guards';

type ViewerLite = { discordId?: string; roleIds: string[] };

function getViewer(req: PayloadRequest): ViewerLite {
  const v = (req as any)?.viewer || {};
  return {
    discordId: v?.discordId ? String(v.discordId) : undefined,
    roleIds: Array.isArray(v?.roleIds) ? v.roleIds.map(String) : [],
  };
}

async function loadRoleContext(req: PayloadRequest, viewerRoleIds: string[]) {
  if (!viewerRoleIds?.length) {
    return { matchingRoleDocIds: [] as string[], isFullEditor: false, isCmsAdmin: false, maxReadRank: 0 };
  }
  const roles = await req.payload.find({
    collection: 'discordRoles',
    where: { roleId: { in: viewerRoleIds } },
    limit: 1000,
    depth: 0,
  });

  let isFullEditor = false;
  let isCmsAdmin = false;
  let maxReadRank = 0;

  const matchingRoleDocIds: string[] = [];
  for (const r of roles.docs as any[]) {
    if (r?.id) matchingRoleDocIds.push(String(r.id));
    if (r?.fullEditorialAccess) isFullEditor = true;
    if (r?.cmsAdmin) isCmsAdmin = true;
    const rank = typeof r?.rank === 'number' ? r.rank : 0;
    if (rank > maxReadRank) maxReadRank = rank;
  }
  return { matchingRoleDocIds, isFullEditor, isCmsAdmin, maxReadRank };
}

async function writableSubcategoryIds(req: PayloadRequest, matchingRoleDocIds: string[]): Promise<string[]> {
  if (!matchingRoleDocIds.length) return [];
  const subs = await req.payload.find({ collection: 'subcategories', where: {}, limit: 1000, depth: 0 });

  const catIds = new Set<string>();
  for (const s of subs.docs as any[]) {
    const cid = s?.category?.id ?? s?.category;
    if (cid) catIds.add(String(cid));
  }
  const cats = catIds.size
    ? await req.payload.find({
        collection: 'categories',
        where: { id: { in: Array.from(catIds) } },
        limit: 1000,
        depth: 0,
      })
    : { docs: [] as any[] };
  const catById = new Map<string, any>();
  for (const c of cats.docs as any[]) catById.set(String(c.id), c);

  const result: string[] = [];
  for (const s of subs.docs as any[]) {
    const inherit = s?.inheritWriteFromCategory ?? true;
    const subAllowedIds: string[] = Array.isArray(s?.allowedWriteRoles)
      ? s.allowedWriteRoles.map((x: any) => String(x?.id ?? x))
      : [];

    let effectiveAllowed: string[] = subAllowedIds;
    if (inherit) {
      const cid = s?.category?.id ?? s?.category;
      const c = cid ? catById.get(String(cid)) : undefined;
      const catAllowedIds: string[] = Array.isArray(c?.allowedWriteRoles)
        ? c.allowedWriteRoles.map((x: any) => String(x?.id ?? x))
        : [];
      effectiveAllowed = catAllowedIds;
    }

    if (effectiveAllowed.length > 0 && effectiveAllowed.some((id) => matchingRoleDocIds.includes(String(id)))) {
      result.push(String(s.id));
    }
  }
  return result;
}

// simple slugify (ASCII-ish)
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
  let candidate = base || 'page';
  let n = 1;
  while (true) {
    const existing = await req.payload.find({
      collection: 'pages',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
    });
    const hit = existing.docs?.[0];
    if (!hit || (currentId && String(hit.id) === String(currentId))) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title' },

  versions: { drafts: true },

  access: {
    /**
     * Draft-aware read logic.
     * - CMS admin UI (any authenticated Payload user): see everything.
     * - Full editors / CmsAdmin (resolved from discordRoles by roleIds): see everything.
     * - Everyone else: published by rank OR drafts authored by viewer within currently writable subcategories.
     */
    read: async ({ req }) => {
      if (req.user) return true;

      const { discordId, roleIds } = getViewer(req);
      const rank = await viewerRank(req);
      const { matchingRoleDocIds, isFullEditor, isCmsAdmin } = await loadRoleContext(req, roleIds || []);
      if (isFullEditor || isCmsAdmin) return true;

      const publishedByRank = {
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

      if (!discordId || !matchingRoleDocIds.length) {
        return publishedByRank as any;
      }

      const writableSubs = await writableSubcategoryIds(req, matchingRoleDocIds);
      const myDraftsWhere =
        writableSubs.length > 0
          ? {
              and: [
                { _status: { equals: 'draft' } },
                { createdByDiscordId: { equals: discordId } },
                { subcategory: { in: writableSubs } },
              ],
            }
          : { id: { equals: '___no_match___' } };

      return { or: [publishedByRank, myDraftsWhere] } as any;
    },

    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },

  fields: [
    { name: 'title', type: 'text', required: true },

    // unique slug (auto-generated in hook if empty)
    { name: 'slug', type: 'text', required: true, unique: true, index: true },

    // Category first
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

    // Subcategory filtered by selected Category
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      required: true,
      admin: {
        description: 'Only subcategories from the chosen Category are shown.',
        position: 'sidebar',
      },
      filterOptions: ({ siblingData }) => {
        const catId = (siblingData as any)?.category?.id ?? (siblingData as any)?.category ?? undefined;
        if (!catId) return true; // no filter yet
        return { category: { equals: String(catId) } } as any;
      },
    },

    {
      name: 'series',
      type: 'relationship',
      relationTo: 'series',
      required: false,
      admin: { description: 'Optional: link this page to a Series' },
    },

    {
      name: 'seriesPart',
      type: 'number',
      required: false,
      admin: { description: 'Optional: order within the Series (e.g. 1, 2, 3...)' },
      validate: (val: unknown): true | string => {
        if (val == null) return true;
        if (typeof val !== 'number') return 'seriesPart must be a number';
        if (!Number.isInteger(val) || val < 0 || val > 10000)
          return 'seriesPart must be an integer between 0 and 10000';
        return true;
      },
    },

    {
      name: 'template',
      type: 'relationship',
      relationTo: 'templates',
      required: true,
      admin: { description: 'Controls allowed blocks and default rendering.' },
    },

    { name: 'excerpt', type: 'textarea' },
    { name: 'minRank', type: 'number', label: 'Minimum rank to read', defaultValue: 0, min: 0 },

    iconKeyField('iconKey'),
    iconColorField('iconColor'),

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
      name: 'blocks',
      type: 'blocks',
      label: 'Content Blocks',
      blocks: [RichTextBlock, ImageBlock, ImageWithCaption, GalleryBlock, MediaTextBlock, VideoEmbedBlock, CTABlock],
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
    // Auto-generate/normalize slug BEFORE validation
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        const d = (data || {}) as any;
        const currentId = (originalDoc as any)?.id;
        const raw =
          d.slug && String(d.slug).trim().length > 0
            ? String(d.slug)
            : String(d.title || '');
        let base = toSlug(raw);
        if (!base) base = 'page';
        d.slug = await findUniqueSlug(req, base, currentId);
        return d;
      },
    ],

    // Main content / consistency checks + forced blocks + icon fallback
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const payload = req.payload;

        // IMPORTANT: compute templateId ONCE and reuse to avoid duplicate declarations.
        const templateId = (data as any)?.template?.id ?? (data as any)?.template;

        try {
          // Seed default blocks from template on create if none
          const isCreate = operation ? operation === 'create' : !(originalDoc as any)?.id;
          const hasBlocks = Array.isArray((data as any)?.blocks) && (data as any).blocks.length > 0;

          if (isCreate && !hasBlocks && templateId) {
            const tpl = await payload.findByID({ collection: 'templates', id: String(templateId), depth: 0 });
            const preset = Array.isArray((tpl as any)?.defaultBlocks) ? (tpl as any).defaultBlocks : [];
            if (preset.length) (data as any).blocks = preset.map((b: any) => ({ ...b }));
          }
        } catch {
          // no-op
        }

        // Validate blocks against template + enforce template constraints
        if (templateId) {
          const tpl = await payload.findByID({ collection: 'templates', id: String(templateId), depth: 0 });
          const allowed: string[] = Array.isArray((tpl as any)?.allowedBlocks) ? (tpl as any).allowedBlocks : [];
          const forcedStart: any[] = Array.isArray((tpl as any)?.forcedStartBlocks) ? (tpl as any).forcedStartBlocks : [];
          const forcedEnd: any[] = Array.isArray((tpl as any)?.forcedEndBlocks) ? (tpl as any).forcedEndBlocks : [];

          // 1) Enforce allowed block types
          const blocks = Array.isArray((data as any)?.blocks) ? (data as any).blocks : [];
          for (const b of blocks) {
            const type = (b as any)?.blockType;
            if (type && allowed.length && !allowed.includes(type)) {
              throw new Error(`Block "${type}" is not allowed by template "${(tpl as any)?.key}".`);
            }
          }

          // 2) Enforce forced start/end blocks: remove duplicates of forced types in middle, then inject start/end
          const forcedTypes = new Set<string>([
            ...forcedStart.map((b: any) => String(b?.blockType)),
            ...forcedEnd.map((b: any) => String(b?.blockType)),
          ]);

          const middle = (Array.isArray((data as any)?.blocks) ? (data as any).blocks : [])
            .filter((b: any) => !forcedTypes.has(String(b?.blockType)));

          (data as any).blocks = [
            ...forcedStart.map((b: any) => ({ ...b })),
            ...middle,
            ...forcedEnd.map((b: any) => ({ ...b })),
          ];

          // 3) Page icon fallback: if page.iconKey missing/cleared, inherit from template.defaultIconKey
          const pageHasIcon = Boolean((data as any)?.iconKey);
          const tplDefaultIcon = (tpl as any)?.defaultIconKey;
          if (!pageHasIcon && tplDefaultIcon) {
            (data as any).iconKey = (tplDefaultIcon as any)?.id ?? tplDefaultIcon;
          }

          // (Optional) default color fallback too
          if (!(data as any)?.iconColor && (tpl as any)?.defaultColorToken) {
            (data as any).iconColor = (tpl as any)?.defaultColorToken;
          }
        }

        // Ensure Category/Subcategory consistency
        const subId = (data as any)?.subcategory?.id ?? (data as any)?.subcategory;
        let catId = (data as any)?.category?.id ?? (data as any)?.category;

        if (subId) {
          const sub = await payload.findByID({ collection: 'subcategories', id: String(subId), depth: 0 });
          const subCatId = (sub as any)?.category?.id ?? (sub as any)?.category;

          // If Category not set but Subcategory is set, auto-fill Category from Subcategory
          if (!catId && subCatId) {
            (data as any).category = String(subCatId);
            catId = String(subCatId);
          }

          // If both provided, enforce they match
          if (catId && subCatId && String(catId) !== String(subCatId)) {
            throw new Error('Selected Subcategory does not belong to the chosen Category.');
          }
        }

        // Template allow-list via Subcategory/Category inheritance (reuse templateId)
        if (subId && templateId) {
          const sub = await payload.findByID({ collection: 'subcategories', id: String(subId), depth: 0 });
          const subCatId = (sub as any)?.category?.id ?? (sub as any)?.category;

          let allowedTplIds: string[] = [];
          const inherit = (sub as any)?.inheritAllowedTemplatesFromCategory ?? true;

          if (inherit && subCatId) {
            const cat = await payload.findByID({ collection: 'categories', id: String(subCatId), depth: 0 });
            allowedTplIds = Array.isArray((cat as any)?.allowedTemplates)
              ? (cat as any).allowedTemplates.map((t: any) => String(t?.id ?? t))
              : [];
          } else {
            allowedTplIds = Array.isArray((sub as any)?.allowedTemplates)
              ? (sub as any).allowedTemplates.map((t: any) => String(t?.id ?? t))
              : [];
          }

          if (allowedTplIds.length && !allowedTplIds.includes(String(templateId))) {
            throw new Error('Template is not allowed by the selected Subcategory/Category.');
          }
        }

        // Preserve createdByDiscordId on update; auto-fill on create if missing
        if (
          operation === 'update' &&
          (originalDoc as any)?.createdByDiscordId &&
          (data as any)?.createdByDiscordId !== (originalDoc as any).createdByDiscordId
        ) {
          (data as any).createdByDiscordId = (originalDoc as any).createdByDiscordId;
        }
        if (operation === 'create') {
          const v = getViewer(req);
          if (!(data as any)?.createdByDiscordId && v.discordId) {
            (data as any).createdByDiscordId = v.discordId;
          }
        }

        return (data as any);
      },
    ],
  },
};

export default Pages;
