// FILE: apps/cms/src/blocks/Image.ts
import type { Block } from 'payload';

export const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Image',
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
    },
  ],
};
