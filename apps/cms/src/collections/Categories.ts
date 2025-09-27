// FILE: apps/cms/src/collections/Categories.ts
import type { CollectionConfig } from 'payload';
import { slugField } from '../utils/slugField';
import { viewerRank } from '../access/guards';
import { iconColorField, iconKeyField } from '../fields/icon';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title' },

  access: {
    read: async ({ req }) => {
      const rank = await viewerRank(req);
      return {
        or: [
          { readPolicy: { equals: 'public' }, readMinRank: { exists: false } },
          { readPolicy: { equals: 'rank_at_least' }, readMinRank: { less_than_equal: rank } },
        ],
      };
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(true),

    {
      name: 'navHidden',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'If true, do not show this category in menus.' },
    },

    // READ visibility
    {
      name: 'readPolicy',
      label: 'Read policy',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Rank at least…', value: 'rank_at_least' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'readMinRank',
      label: 'Minimum rank to read',
      type: 'number',
      admin: { position: 'sidebar', description: 'Used when policy is “Rank at least…”.' },
    },

    // WRITE allow-list (unchanged)
    {
      name: 'allowedWriteRoles',
      label: 'Allowed writer roles',
      type: 'relationship',
      relationTo: 'discordRoles',
      hasMany: true,
      admin: {
        description:
          'Discord roles allowed to create/edit content under this Category (unless overridden at Subcategory).',
        position: 'sidebar',
      },
    },

    // Template allow-list (Subcategories can inherit; empty = allow any)
    {
      name: 'allowedTemplates',
      label: 'Allowed templates',
      type: 'relationship',
      relationTo: 'templates',
      hasMany: true,
      admin: {
        description: 'If empty, any template is allowed (unless a Subcategory overrides).',
        position: 'sidebar',
      },
    },

    // IMPORTANT: keep legacy field names so we replace, not add
    iconKeyField('iconKey'),
    iconColorField('iconColor'),
  ],
};

export default Categories;
