// FILE: apps/cms/src/globals/Footer.ts
import type { GlobalConfig } from 'payload';

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      labels: { singular: 'Column', plural: 'Columns' },
      maxRows: 3,
      fields: [
        { name: 'title', type: 'text' },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'href',
              type: 'text',
              required: true,
              admin: { description: 'Internal path (/...) or full URL (https://...)' },
            },
            { name: 'isExternal', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
    {
      name: 'social',
      type: 'array',
      fields: [
        {
          name: 'network',
          type: 'select',
          options: [
            { label: 'Discord', value: 'discord' },
            { label: 'X / Twitter', value: 'twitter' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'GitHub', value: 'github' },
            { label: 'Website', value: 'website' },
            { label: 'Other', value: 'other' },
          ],
        },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      admin: { description: 'Footer note or legal text.' },
    },
  ],
};
