// FILE: apps/cms/src/blocks/Gallery.ts
import type { Block } from 'payload';

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Image',
        },
        { name: 'alt', type: 'text', label: 'Alt text' },
      ],
    },
  ],
};
