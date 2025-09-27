// FILE: apps/cms/src/blocks/Callout.ts
import type { Block } from 'payload';

export const Callout: Block = {
  slug: 'callout',
  labels: { singular: 'Callout', plural: 'Callouts' },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
  ],
};
