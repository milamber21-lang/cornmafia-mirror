// FILE: apps/cms/src/blocks/RichText.ts
import type { Block } from 'payload';

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [
    {
      name: 'content',
      label: 'Content',
      type: 'richText',
      required: false,
    },
  ],
};
