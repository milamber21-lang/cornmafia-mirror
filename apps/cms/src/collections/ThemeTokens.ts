// FILE: apps/cms/src/collections/ThemeTokens.ts
import type { CollectionConfig } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../access/isCmsAdmin';

export const ThemeTokens: CollectionConfig = {
  slug: 'themeTokens',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['key', 'label', 'enabled', 'updatedAt'],
    description: 'Manage theme tokens (e.g., colors) used across the site.',
  },
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'label', type: 'text', required: true },
    {
      name: 'preview',
      type: 'text',
      required: false,
      admin: { description: 'Optional preview color (hex like #CC262D) or CSS var name' },
    },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
  ],
};
