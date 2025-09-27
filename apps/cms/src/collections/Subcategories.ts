// FILE: apps/cms/src/collections/Subcategories.ts
import type { CollectionConfig } from 'payload';
import { slugField } from '../utils/slugField';
import { viewerRank } from '../access/guards';
import { iconColorField, iconKeyField } from '../fields/icon';

export const Subcategories: CollectionConfig = {
  slug: 'subcategories',
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
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    { name: 'title', type: 'text', required: true },
    slugField(true),

    {
      name: 'navHidden',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'If true, do not show this subcategory anywhere in nav pickers.' },
    },

    // Template allow-list with inheritance
    {
      name: 'inheritAllowedTemplatesFromCategory',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'If enabled, use the Category’s allowed templates. Disable to override below.',
        position: 'sidebar',
      },
    },
    {
      name: 'allowedTemplates',
      label: 'Allowed Templates (override)',
      type: 'relationship',
      relationTo: 'templates',
      hasMany: true,
      admin: {
        description: 'Only used when not inheriting. If empty, any template is allowed.',
        position: 'sidebar',
        condition: (_: unknown, siblingData: any) =>
          siblingData?.inheritAllowedTemplatesFromCategory === false,
      },
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

    // WRITE allow-list (inherit or override)
    {
      name: 'inheritWriteFromCategory',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'If enabled, use the Category’s allowed writer roles. Disable to override below.',
        position: 'sidebar',
      },
    },
    {
      name: 'allowedWriteRoles',
      label: 'Allowed writer roles (override)',
      type: 'relationship',
      relationTo: 'discordRoles',
      hasMany: true,
      admin: {
        description: 'Only used when not inheriting from Category.',
        position: 'sidebar',
        condition: (_: unknown, siblingData: any) =>
          siblingData?.inheritWriteFromCategory === false,
      },
    },

    // IMPORTANT: keep legacy field names so we replace, not add
    iconKeyField('iconKey'),
    iconColorField('iconColor'),
  ],
};

export default Subcategories;
