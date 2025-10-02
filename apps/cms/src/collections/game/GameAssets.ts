// FILE: apps/cms/src/collections/game/GameAssets.ts
// Language: TypeScript

import type { CollectionConfig, PayloadRequest } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../../access/isCmsAdmin';

function toSlug(input: string): string {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Safely extract doc.id as a string, supporting string | number ids */
function getIdFromDoc(doc: unknown): string | undefined {
  if (!doc || typeof doc !== 'object') return undefined;
  if (!('id' in doc)) return undefined;
  const v = (doc as { id?: unknown }).id;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
}

async function findUniqueSlug(req: PayloadRequest, base: string, currentId?: string): Promise<string> {
  let candidate = base || 'asset';
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await req.payload.find({
      collection: 'gameAssets',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
    });

    const hit = Array.isArray(existing.docs) ? existing.docs[0] : undefined;
    const hitId = getIdFromDoc(hit);

    if (!hit || (currentId && hitId && hitId === currentId)) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export const GameAssets: CollectionConfig = {
  slug: 'gameAssets',
  admin: { useAsTitle: 'name', group: 'Game' },
  timestamps: true,
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'gameAssetTypes',
      required: true,
      admin: { description: 'Select the asset type (e.g., plot, item, ...).' },
    },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'comment', type: 'textarea' },
    {
      name: 'status',
      type: 'relationship',
      relationTo: 'gameAssetStatuses',
      required: true,
      admin: { description: 'Lifecycle status, e.g., active / deprecated / draft.' },
    },
    {
      name: 'iconMedia',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: { description: 'Optional icon.' },
    },
    {
      name: 'coverMedia',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: { description: 'Optional cover image.' },
    },
    { name: 'extra', type: 'json', required: false },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        const d = (data || {}) as Record<string, unknown>;
        const currentId = getIdFromDoc(originalDoc);

        const raw =
          typeof d.slug === 'string' && d.slug.trim().length > 0
            ? d.slug
            : typeof d.name === 'string'
            ? d.name
            : 'asset';

        let base = toSlug(raw);
        if (!base) base = 'asset';

        d.slug = await findUniqueSlug(req, base, currentId);
        return d;
      },
    ],
  },
};

export default GameAssets;
