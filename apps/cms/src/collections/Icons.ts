// FILE: apps/cms/src/collections/Icons.ts
import type { CollectionConfig } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../access/isCmsAdmin';

export const Icons: CollectionConfig = {
  slug: 'icons',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['key', 'label', 'source', 'lucideName', 'iconMedia', 'enabled', 'updatedAt'],
    description: 'Manage the icon set used across Categories, Subcategories, Templates, and Pages.',
  },
  access: {
    read: () => true,
    create: cmsAdminOrPayloadAdmin,
    update: cmsAdminOrPayloadAdmin,
    delete: cmsAdminOrPayloadAdmin,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Machine key, e.g. help-circle, sword, custom:corn' },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'Human-readable label shown in pickers' },
    },

    // NEW: icon source
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'lucide',
      options: [
        { label: 'Lucide', value: 'lucide' },
        { label: 'Media', value: 'media' },
      ],
      admin: {
        description: 'Choose between a Lucide icon name or an uploaded media file.',
      },
    },

    // Lucide option
    {
      name: 'lucideName',
      type: 'text',
      required: false,
      admin: {
        condition: (data) => (data?.source ?? 'lucide') === 'lucide',
        description: 'Lucide icon name (e.g. help-circle). If empty, "key" will be used.',
      },
    },

    // Media option (e.g., SVG/PNG from Media collection)
    {
      name: 'iconMedia',
      type: 'relationship',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => (data?.source ?? 'lucide') === 'media',
        description: 'Upload/select an image or SVG from Media.',
      },
    },

    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Disable to hide from pickers without deleting' },
    },
  ],
};

export default Icons;
