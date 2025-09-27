// FILE: apps/cms/src/blocks/ButtonRow.ts
import type { Block } from 'payload';

export const ButtonRow: Block = {
  slug: 'buttonRow',
  labels: { singular: 'Button Row', plural: 'Button Rows' },
  fields: [
    {
      name: 'buttons',
      type: 'array',
      required: true,
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: { description: 'Internal path like /learn/... or full URL https://...' },
        },
        { name: 'isExternal', type: 'checkbox', defaultValue: false },
      ],
      admin: { description: 'Rendered in a row.' },
    },
  ],
};
